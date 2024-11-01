const sharp = require('sharp');

/**
 * Compress an image buffer with the specified quality.
 * This reads the image from a temporary file, processes it, and writes the output to another file.
 */
const compressImage = async (inputPath, outputPath, quality = 80) => {
    try {
        // Use sharp to read the input file, compress it, and write the result to outputPath
        await sharp(inputPath)
            .jpeg({
                quality: quality,
                mozjpeg: true
            })
            .toFile(outputPath);
        
        process.exit(0); // Exit successfully
    }
    catch (error) {
        console.error('Error compressing image:', error);
        process.exit(1); // Exit with error code
    }
};

// Get the input and output file paths and quality from the command-line arguments
const inputPath = process.argv[2];
const outputPath = process.argv[3];
const quality = process.argv[4] || 80;

// Run the compression process
compressImage(inputPath, outputPath, parseInt(quality, 10));
