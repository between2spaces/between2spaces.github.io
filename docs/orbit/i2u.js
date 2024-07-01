// imageToUnicode.js
import { createCanvas, loadImage } from 'canvas';
import { writeFileSync } from 'fs';

class ImageToUnicode {
  constructor(unicodeSet, tileWidth, tileHeight) {
    this.unicodeSet = unicodeSet;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.canvas = createCanvas(1, 1);
    this.ctx = this.canvas.getContext('2d');
  }

  async convert(imagePath) {
    const img = await loadImage(imagePath);
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);

    const tilesX = Math.floor(img.width / this.tileWidth);
    const tilesY = Math.floor(img.height / this.tileHeight);
    let result = '';

    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const tileData = this.ctx.getImageData(
          x * this.tileWidth,
          y * this.tileHeight,
          this.tileWidth,
          this.tileHeight
        );
        const closestChar = this.findClosestUnicode(tileData);
        result += closestChar;
      }
      result += '\n';
    }

    return result;
  }

  findClosestUnicode(tileData) {
    let closestChar = '';
    let minDifference = Infinity;

    for (const char of this.unicodeSet) {
      const charData = this.getUnicodeImageData(char);
      const difference = this.compareImageData(tileData, charData);

      if (difference < minDifference) {
        minDifference = difference;
        closestChar = char;
      }
    }

    return closestChar;
  }

  getUnicodeImageData(char) {
    this.ctx.clearRect(0, 0, this.tileWidth, this.tileHeight);
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.tileWidth, this.tileHeight);
    this.ctx.fillStyle = 'black';
    this.ctx.font = `${this.tileHeight}px Arial`;
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(char, 0, 0);
    return this.ctx.getImageData(0, 0, this.tileWidth, this.tileHeight);
  }

  compareImageData(data1, data2) {
    let difference = 0;
    for (let i = 0; i < data1.data.length; i += 4) {
      const gray1 = (data1.data[i] + data1.data[i + 1] + data1.data[i + 2]) / 3;
      const gray2 = (data2.data[i] + data2.data[i + 1] + data2.data[i + 2]) / 3;
      difference += Math.abs(gray1 - gray2);
    }
    return difference;
  }
}

export default ImageToUnicode;

// main.js
import ImageToUnicode from './imageToUnicode.js';
import { writeFileSync } from 'fs';

const unicodeSet = ['█', '▓', '▒', '░', ' '];
const converter = new ImageToUnicode(unicodeSet, 10, 20);

const imagePath = 'path/to/your/image.jpg';

converter.convert(imagePath)
  .then(result => {
    console.log(result);
    
    // Optionally, save the result to a file
    writeFileSync('output.txt', result);
  })
  .catch(error => console.error('Error:', error));
