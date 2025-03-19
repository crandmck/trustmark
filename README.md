# TrustMark

This repository contains the official, open source implementation of TrustMark watermarking for the Content Authenticity Initiative (CAI) as described in [**TrustMark - Universal Watermarking for Arbitrary Resolution Images**](https://arxiv.org/abs/2311.18297) (`arXiv:2311.18297`) by [Tu Bui](https://www.surrey.ac.uk/people/tu-bui)[^1], [Shruti Agarwal](https://research.adobe.com/person/shruti-agarwal/)[^2], and [John Collomosse](https://www.collomosse.com)[^1] [^2].

[^1]: [DECaDE](https://decade.ac.uk/) Centre for the Decentralized Digital Economy, University of Surrey, UK.

[^2]: [Adobe Research](https://research.adobe.com/), San Jose, CA.

## Overview

This repository contains the following directories:

- `/python`: Python implementation of TrustMark for encoding, decoding and removing image watermarks (using PyTorch).  For more information, see [TrustMark - Python implementation](./python/README.md).
- `/js`: Javascript implementation of TrustMark decoding of image watermarks (using ONNX).  For more information, see [TrustMark - JavaScript implementation](./python/README.md).
- `/c2pa`: Python example of how to indicate the presence of a TrustMark watermark in a C2PA manifest. For more information, see [Using TrustMark with C2PA](./c2pa/README.md).

Models (**ckpt** PyTorch model file for Python and **onnx** ONNX model file for JavaScript) are not packaged in this repo due to size, but are downloaded upon first use.  See the code for [URLs and md5 hashes](https://github.com/adobe/trustmark/blob/4ef0dde4abd84d1c6873e7c5024482f849db2c73/python/trustmark/trustmark.py#L30) for a direct download link.

More information:
- For answers to common questions, see the [FAQ](FAQ.md).
- For information on configuring TrustMark in Python, see [Configuring TrustMark](CONFIG.md).

## Installation

### Prerequisite

You must have Python 3.8.5 or higher to use the TrustMark Python implementation.

### Installing from PyPI

The easiest way to install TrustMark is from the [Python Package Index (PyPI)](https://pypi.org/project/trustmark/) by entering this command:

```
pip install trustmark
```

Alternatively, after you've cloned the repository, you can install from the `python` directory:

```
cd trustmark/python
pip install .
```

## Quickstart

To get started quickly, run the `python/test.py` script that provides examples of watermarking several 
image files from the `images` directory. 

### Run the example

Run the example as follows:

```sh
cd trustmark/python
python test.py
```

You'll see output like this:

```
Initializing TrustMark watermarking with ECC using [cpu]
Extracted secret: 1000000100001110000010010001011110010001011000100000100110110 (schema 1)
PSNR = 50.357909
No secret after removal
```

### Example script

The `python/test.py` script provides examples of watermarking a JPEG photo, a JPEG GenAI image, and an RGBA PNG image. The example uses TrustMark variant Q to encode the word `mysecret` in ASCII7 encoding into the image `ufo_240.jpg` which is then decoded, and then removed from the image.

```python
from trustmark import TrustMark
from PIL import Image

# init
tm=TrustMark(verbose=True, model_type='Q') # or try P

# encoding example
cover = Image.open('images/ufo_240.jpg').convert('RGB')
tm.encode(cover, 'mysecret').save('ufo_240_Q.png')

# decoding example
cover = Image.open('images/ufo_240_Q.png').convert('RGB')
wm_secret, wm_present, wm_schema = tm.decode(cover)

if wm_present:
   print(f'Extracted secret: {wm_secret}')
else:
   print('No watermark detected')

# removal example
stego = Image.open('images/ufo_240_Q.png').convert('RGB')
im_recover = tm.remove_watermark(stego)
im_recover.save('images/recovered.png')
```

## GPU setup

TrustMark runs well on CPU hardware.  

To leverage GPU compute for the PyTorch implementation on Ubuntu Linux, first install Conda, then use the following commands to install:

```sh
conda create --name trustmark python=3.10
conda activate trustmark
conda install pytorch cudatoolkit=12.8 -c pytorch -c conda-forge
pip install torch==2.1.2 torchvision==0.16.2 -f https://download.pytorch.org/whl/torch_stable.html
pip install .
```

For the JavaScript implementation, a Chromium browser automatically uses WebGPU, if available.

## Data schema

Packaged TrustMark models and code are trained to encode a payload of 100 bits.

To promote interoperability, use the data schema implemented in `python/datalayer.py`.  This enables you to choose an error correction level over the raw 100 bits of payload.

### Encoding modes

The following table describes TrustMark's encoding modes:

| Encoding | Protected payload | Number of bit flips allowed |
|----------|-------------------|-----------------------------|
| `Encoding.BCH_5` | 61 bits (+ 35 ECC bits) | 5  |
| `Encoding.BCH_4` | 68 bits (+ 28 ECC bits) | 4  |
| `Encoding.BCH_3` | 75 bits (+ 21 ECC bits) | 3  |
| `Encoding.BCH_SUPER` | 40 bits (+ 56 ECC bits) | 8 |

Specify the mode when you instantiate the encoder, as follows:

```py
tm=TrustMark(verbose=True, model_type='Q', encoding_type=TrustMark.Encoding.<ENCODING>)
```

Where `<ENCODING>` is `BCH_5`, `BCH_4`, `BCH_3`, or `BCH_SUPER`.

For example:

```py
tm=TrustMark(verbose=True, model_type='Q', encoding_type=TrustMark.Encoding.BCH_5)
```

The decoder automatically detects the data schema in a watermark, allowing you to choose the level of robustness that best suits your use case.

### Payload encoding

The raw 100 bits break down into D+E+V=100 bits, where D is the protect payload (for example, 61) and E are the error correction parity bits (e.g. 35) and V are the version bits (always four). The version bits comprise two reserved (unused) bits, and two bits encoding an $.


## Citation

If you find this work useful we request you please cite the repository and/or TrustMark paper as follows:

```
@article{trustmark,
title={Trustmark: Universal Watermarking for Arbitrary Resolution Images},
author={Bui, Tu and Agarwal, Shruti and Collomosse, John},
journal = {ArXiv e-prints},
archivePrefix = "arXiv",
eprint = {2311.18297},
year = 2023,
month = nov
}
```

## License 

This package is is distributed under the terms of the [MIT license](https://github.com/adobe/trustmark/blob/main/LICENSE).
