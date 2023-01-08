from PIL import Image
import numpy as np


image  = Image.open('mnist_sprite.png')
array = np.asarray(image)[:100]

cut_image = Image.fromarray(array)
cut_image.save("mnist_sample.png")