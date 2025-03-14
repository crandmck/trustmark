# TrustMark - Universal Watermarking for Arbitrary Resolution Images

The official, open source (MIT licensed) implementation of TrustMark watermarking  for the Content Authenticity Initiative (CAI) as described in  [**TrustMark - Universal Watermarking for Arbitrary Resolution Images**](https://arxiv.org/abs/2311.18297)
[Tu Bui](https://www.surrey.ac.uk/people/tu-bui)[^1], [Shruti Agarwal](https://research.adobe.com/person/shruti-agarwal/)[^2], [John Collomosse](https://www.collomosse.com)[^1] [^2]

[^1]: [DECaDE](https://decade.ac.uk/) Centre for the Decentralized Digital Economy, University of Surrey, UK.

[^2]: [Adobe Research](https://research.adobe.com/), San Jose, CA.

## Repository overview

This repository contains the following directories:

- `/python`: Python implementation of TrustMark for encoding, decoding and removing image watermarks (using PyTorch).  
- `/js`: Javascript implementation of TrustMark decoding of image watermarks (using ONNX).
- `/c2pa`: Python example of how to indicate the presence of a TrustMark watermark in a C2PA metadata (manifest).

Models (**ckpt** and **onnx**) are not packaged in this repo due to size, but are downloaded upon first use.  See the code for [URLs and md5 hashes](https://github.com/adobe/trustmark/blob/4ef0dde4abd84d1c6873e7c5024482f849db2c73/python/trustmark/trustmark.py#L30) for a direct download link.

## More information

- For answers to common questions, see the extensive [TrustMark FAQ](FAQ.md).
- For information on configuring TrustMark, see [Configuring TrustMark](CONFIG.md).
  
## Quickstart

### Prerequisite

You must have Python 3.8.5 or higher to use the TrustMark Python implementation.

### Installation

The easiest way to install TrustMark is from [PyPi](https://pypi.org/project/trustmark/):

```
pip install trustmark
```

Alternatively, you can install from the `python` directory:

```
cd trustmark/python
pip install .
```

### Example

The `images` directory contains a number of example images.

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

### Run the example

Run the example as follows:

```sh
cd python
python test.py
```

You'll see output like this:

```
Initializing TrustMark watermarking with ECC using [cpu]
Extracted secret: 1000000100001110000010010001011110010001011000100000100110110 (schema 1)
PSNR = 50.357909
No secret after removal
```

### GPU setup

TrustMark runs fine on CPU hardware.  To leverage GPU compute for the PyTorch implementation, use the  following clean install on Ubuntu Linux: 

```sh
conda create --name trustmark python=3.10
conda activate trustmark
conda install pytorch cudatoolkit=12.8 -c pytorch -c conda-forge
pip install torch==2.1.2 torchvision==0.16.2 -f https://download.pytorch.org/whl/torch_stable.html
pip install .
```

For the JavaScript implementation, if you are using a Chromium browser it automatically will use WebGPU, if available.

### TrustMark data schema

Packaged TrustMark models and code are trained to encode a payload of 100 bits.

To promote interoperability, use the data schema implemented in `python/datalayer`.  This enables you to choose an error correction level over the raw 100 bits of payload.

#### Supported modes

* `Encoding.BCH_5` - Protected payload of 61 bits (+ 35 ECC bits) - allows for 5 bit flips.
* `Encoding.BCH_4` - Protected payload of 68 bits (+ 28 ECC bits) - allows for 4 bit flips.
* `Encoding.BCH_3` - Protected payload of 75 bits (+ 21 ECC bits) - allows for 3 bit flips.
* `Encoding.BCH_SUPER` - Protected payload of 40 bits (+ 56 ECC bits) - allows for 8 bit flips.

For example, instantiate the encoder as:

```py
tm=TrustMark(verbose=True, model_type='Q', encoding_type=TrustMark.Encoding.BCH_5)
```

The decoder will automatically detect the data schema in a given watermark, allowing you to choose the level of robustness that best suits your use case.

#### Payload encoding

The raw 100 bits break down into D+E+V=100 bits, where D is the protect payload (e.g. 61) and E are the error correction parity bits (e.g. 35) and V are the version bits (always 4). The version bits comprise 2 reserved (unused) bits, and 2 bits encoding an $
  
### Using with C2PA

#### Durable Content Credentials

Open standards such as Content Credentials, developed by the [Coalition for Content Provenance and Authenticity(C2PA) ](https://c2pa.org/), describe ways to encode information about an image’s history or _provenance_, such as how and when it was made. This information is usually carried within the image’s metadata.

However, C2PA metadata can be accidentally removed when the image is shared through platforms that do not yet support the standard. If a copy of that metadata is retained in a database, the TrustMark identifier carried inside the watermark can be used as a key to look up that information from the database. This is referred to as a [_Durable Content Credential_](https://contentauthenticity.org/blog/durable-content-credentials) and the technical term for the identifier is a _soft binding_.

When used as a soft binding, TrustMark should be used to encode a random identifier via one of the Encoding types `BCH_n` described in the data schema described in the previous section of this document.  Example `c2pa/c2pa_watermark_example.py` provides an example use of TrustMark, and also how the identifer should be reflected within the C2PA metadata (manifest) via a 'soft binding assertion'.

For more information, see the [FAQ](FAQ.md#how-does-trustmark-align-with-provenance-standards-such-as-the-c2pa).

#### Signpost watermark

TrustMark [coexists well with most other image watermarks](https://arxiv.org/abs/2501.17356) and so can be used as a _signpost_ to indicate the co-presence of another watermarking technology.  This can be helpful, as TrustMark is an open technology it can be used to indicate (signpost) which decoder to obtain and run on an image to decode a soft binding identifier for C2PA.

In this mode the encoding should be `Encoding.BCH_SUPER` and the payload contain an integer identifier that describes the co-present watermark.  The integer should be taken from the registry of C2PA approved watermarks listed in this normative C2PA [softbinding-algorithms-list](https://github.com/c2pa-org/softbinding-algorithms-list) repository.

## License

TrustMark is released under an MIT Open Source License.

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
