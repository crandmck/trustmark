# TrustMark - Universal Watermarking for Arbitrary Resolution Images

An Open Source, MIT licensed implementation of TrustMark watemarking for the Content Authenticity Initiative (CAI) as described in: 

**TrustMark - Universal Watermarking for Arbitrary Resolution Images**

https://arxiv.org/abs/2311.18297 

[Tu Bui](https://www.surrey.ac.uk/people/tu-bui) <sup>1</sup>, [Shruti Agarwal](https://research.adobe.com/person/shruti-agarwal/)  <sup>2</sup> , [John Collomosse](https://www.collomosse.com)  <sup>1,2</sup> 

<sup>1</sup> DECaDE Centre for the Decentralized Digital Economy, University of Surrey, UK. \
<sup>2</sup> Adobe Research, San Jose CA.


This repo contains a Python (v3.8.5 or greater) implementation (`python/`) of TrustMark for encoding, decoding and removing image watermarks.  



### Quick start 

Within the python folder run `pip install .` \
The TrustMark package is also available via PyPi - run `pip install trustmark` to install it indepedent of this repo.

The `python/test.py` script provides examples of watermarking images (a JPEG and a transparent PNG image are provided as examples).  To test the installation the following code snippet in Python shows typical usage:

```python
from trustmark import TrustMark
from PIL import Image

# init
tm=TrustMark(verbose=True, model_type='Q')

# encoding example
cover = Image.open('ufo_240.jpg').convert('RGB')
tm.encode(cover, 'mysecret').save('ufo_240_Q.png')

# decoding example
cover = Image.open('ufo_240_Q.png').convert('RGB')
wm_secret, wm_present, wm_schema = tm.decode(cover)
if wm_present:
  print(f'Extracted secret: {wm_secret}')
else:
  print('No watermark detected')

# removal example
stego = Image.open('ufo_240_Q.png').convert('RGB')
im_recover = tm.remove_watermark(stego)
im_recover.save('recovered.png')
```


### TrustMark Models

Models are now fetched on first use, due to the size and number of model variants


## Citation

If you find this work useful we request you please cite the repo and/or TrustMark paper as follows.

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


