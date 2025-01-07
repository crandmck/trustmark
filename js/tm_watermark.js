/*!
 * TrustMark JS Watermarking Decoder Module
 * Copyright 2024 Adobe. All rights reserved.
 * Licensed under the MIT License.
 * 
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying it.
 */ 

// Constants for model loading and configurations
const MODEL_BASE_URL = "https://cc-assets.netlify.app/watermarking/trustmark-models/";
const TRUSTMARK_VARIANT = "Q";
const WATERMARK_THUMB_SIZE = 256;

let session_wmark;
let session_resize;

// Asynchronously load ONNX models for watermark detection and resizing
(async () => {
  let startTime = new Date();
  try {
    session_resize = await ort.InferenceSession.create(`${MODEL_BASE_URL}resizer.onnx`);
    console.log(`Image resizing model loaded in ${(new Date() - startTime) / 1000} seconds`);
  } catch (error) {
    console.error("Could not load image resizing model", error);
  }

  startTime = new Date();
  try {
    session_wmark = await ort.InferenceSession.create(`${MODEL_BASE_URL}decoder_${TRUSTMARK_VARIANT}.onnx`);
    console.log(`Watermark detection model loaded in ${(new Date() - startTime) / 1000} seconds`);
  } catch (error) {
    console.error("Could not load watermark detection model", error);
  }
})();

/**
 * Converts an image URL to a tensor suitable for processing.
 * @param {string} imageUrl - The URL of the image to load.
 * @returns {Promise<ort.Tensor>} The processed tensor.
 */
async function loadImageAsTensor(imageUrl) {
  const img = new Image();
  img.src = imageUrl;

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, img.width, img.height);

      const { data, width, height } = imgData;
      const totalPixels = width * height;
      const imageTensor = new Float32Array(totalPixels * 3);

      let j = 0;
      const page = width * height;
      const twopage = 2 * page;

      for (let i = 0; i < totalPixels; i++) {
        const index = i * 4;
        imageTensor[j] = data[index] / 255.0; // Red channel
        imageTensor[j + page] = data[index + 1] / 255.0; // Green channel
        imageTensor[j + twopage] = data[index + 2] / 255.0; // Blue channel
        j++;
      }

      resolve(new ort.Tensor('float32', imageTensor, [1, 3, height, width]));
    };

    img.onerror = () => reject("Failed to load image");
  });
}

/**
 * Computes scale factors for image resizing with precision.
 * @param {Array<number>} targetDims - Target dimensions for the image.
 * @param {Array<number>} inputDims - Input tensor dimensions.
 * @returns {Float32Array} Scale factors as a tensor.
 */
function computeScalesFixed(targetDims, inputDims) {
  const [batch, channels, height, width] = inputDims;
  const [targetHeight, targetWidth] = targetDims;

  function computeScale(originalSize, targetSize) {
    let minScale = targetSize / originalSize;
    let maxScale = (targetSize + 1) / originalSize;
    let scale;
    let adjustedSize;

    const tolerance = 1e-12;
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations) {
      scale = (minScale + maxScale) / 2;
      adjustedSize = Math.floor(originalSize * scale + tolerance);

      if (adjustedSize < targetSize) {
        minScale = scale;
      } else if (adjustedSize > targetSize) {
        maxScale = scale;
      } else {
        break; // Found the correct scale
      }

      iterations++;
    }

    return scale;
  }

  const scaleH = computeScale(height, targetHeight);
  const scaleW = computeScale(width, targetWidth);

  return new Float32Array([1.0, 1.0, scaleH, scaleW]);
}

/**
 * Resizes the image tensor to a square size suitable for watermark decoding.
 * @param {ort.Tensor} inputTensor - The input image tensor.
 * @param {number} targetSize - The target size for resizing.
 * @returns {Promise<ort.Tensor>} The resized tensor.
 */
async function runResizeModelSquare(inputTensor, targetSize) {
  try {
    const [batch, channels, height, width] = inputTensor.dims;
    const targetDims = [targetSize, targetSize];

    const scales = computeScalesFixed(targetDims, inputTensor.dims);
    const scalesTensor = new ort.Tensor('float32', scales, [4]);
    const targetSizeTensor = new ort.Tensor('int64', new BigInt64Array([BigInt(targetSize)]), [1]);

    const feeds = {
      X: inputTensor,
      scales: scalesTensor,
      target_size: targetSizeTensor,
    };

    const results = await session_resize.run(feeds);
    return results['Y'];
  } catch (error) {
    console.error("Error during resizing:", error);
    return null;
  }
}

/**
 * Decodes the watermark from the processed image tensor.
 * @param {string} base64Image - Base64 representation of the image.
 * @returns {Promise<object>} Decoded watermark data.
 */
async function runwmark(base64Image) {
  try {
    const inputTensor = await loadImageAsTensor(base64Image);

    const resizedTensorWM = await runResizeModelSquare(inputTensor, WATERMARK_THUMB_SIZE);
    if (!resizedTensorWM) throw new Error("Failed to resize tensor for watermark detection.");

    const feeds = { image: resizedTensorWM };
    const results = await session_wmark.run(feeds);

    const watermarkFloat = results['output']['cpuData'];
    const watermarkBool = watermarkFloat.map((v) => v >= 0);

    const dataObj = DataLayer_Decode(watermarkBool, eccengine);

    return {
      watermark_present: dataObj.valid,
      watermark: dataObj.valid ? dataObj.data_binary : null,
      schema: dataObj.schema,
      c2padata: dataObj.softBindingInfo,
    };
  } catch (error) {
    console.error("Error in watermark decoding:", error);
    return { watermark_present: false, watermark: null, schema: null };
  }
}

