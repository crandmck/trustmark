# TrustMark

This repository contains the official, open source implementation of TrustMark watermarking for the Content Authenticity Initiative (CAI) as described in [**TrustMark - Universal Watermarking for Arbitrary Resolution Images**](https://arxiv.org/abs/2311.18297) by [Tu Bui](https://www.surrey.ac.uk/people/tu-bui)[^1], [Shruti Agarwal](https://research.adobe.com/person/shruti-agarwal/)[^2], and [John Collomosse](https://www.collomosse.com)[^1] [^2].

[^1]: [DECaDE](https://decade.ac.uk/) Centre for the Decentralized Digital Economy, University of Surrey, UK.

[^2]: [Adobe Research](https://research.adobe.com/), San Jose, CA.

## Overview

This repository contains the following directories:

- `/python`: Python implementation of TrustMark for encoding, decoding and removing image watermarks (using PyTorch).  For more information, see [TrustMark - Python implementation](./python/README.md).
- `/js`: Javascript implementation of TrustMark decoding of image watermarks (using ONNX).  For more information, see [TrustMark - JavaScript implementation](./python/README.md).
- `/c2pa`: Python example of how to indicate the presence of a TrustMark watermark in a C2PA metadata (manifest).

Models (**ckpt** and **onnx**) are not packaged in this repo due to size, but are downloaded upon first use.  See the code for [URLs and md5 hashes](https://github.com/adobe/trustmark/blob/4ef0dde4abd84d1c6873e7c5024482f849db2c73/python/trustmark/trustmark.py#L30) for a direct download link.

For answers to common questions, see the extensive [TrustMark FAQ](FAQ.md).

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

## Using with C2PA

### Durable Content Credentials

Open standards such as Content Credentials, developed by the [Coalition for Content Provenance and Authenticity(C2PA)](https://c2pa.org/), describe ways to encode information about an image’s history or _provenance_, such as how and when it was made. This information is usually carried within the image’s metadata.

However, C2PA metadata can be accidentally removed when the image is shared through platforms that do not yet support the standard. If a copy of that metadata is retained in a database, the TrustMark identifier carried inside the watermark can be used as a key to look up that information from the database. This is referred to as a [_Durable Content Credential_](https://contentauthenticity.org/blog/durable-content-credentials) and the technical term for the identifier is a _soft binding_.

When used as a soft binding, TrustMark should be used to encode a random identifier via one of the Encoding types `BCH_n` described in the data schema described in the previous section of this document.  Example `c2pa/c2pa_watermark_example.py` provides an example use of TrustMark, and also how the identifier should be reflected within the C2PA metadata (manifest) via a 'soft binding assertion'.

For more information, see the [FAQ](FAQ.md#how-does-trustmark-align-with-provenance-standards-such-as-the-c2pa).

### Signpost watermark

TrustMark [coexists well with most other image watermarks](https://arxiv.org/abs/2501.17356) and so can be used as a _signpost_ to indicate the co-presence of another watermarking technology.  This can be helpful, as TrustMark is an open technology it can be used to indicate (signpost) which decoder to obtain and run on an image to decode a soft binding identifier for C2PA.

In this mode the encoding should be `Encoding.BCH_SUPER` and the payload contain an integer identifier that describes the co-present watermark.  The integer should be taken from the registry of C2PA approved watermarks listed in this normative C2PA [softbinding-algorithms-list](https://github.com/c2pa-org/softbinding-algorithms-list) repository.

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
