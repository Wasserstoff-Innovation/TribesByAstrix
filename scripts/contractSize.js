const fs = require('fs');
const path = require('path');

async function main() {
  // Get contract artifacts
  const artifactPath = path.join(__dirname, '../artifacts/contracts/PostMinter.sol/PostMinter.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  // Get deployed bytecode size
  const deployedBytecodeSize = artifact.deployedBytecode.length / 2 - 1;
  console.log(`PostMinter Contract Size: ${deployedBytecodeSize} bytes`);
  
  // Check if exceeds limit
  const MAX_CONTRACT_SIZE = 24576; // 24KB limit in Ethereum
  if (deployedBytecodeSize > MAX_CONTRACT_SIZE) {
    console.log(`⚠️ Contract exceeds the size limit of ${MAX_CONTRACT_SIZE} bytes by ${deployedBytecodeSize - MAX_CONTRACT_SIZE} bytes`);
  } else {
    console.log(`✅ Contract is under the size limit by ${MAX_CONTRACT_SIZE - deployedBytecodeSize} bytes`);
  }
  
  // Check libraries
  const librariesPath = path.join(__dirname, '../artifacts/contracts/libraries');
  if (fs.existsSync(librariesPath)) {
    console.log("\nLibrary Sizes:");
    try {
      const libraries = fs.readdirSync(librariesPath);
      for (const lib of libraries) {
        const libPath = path.join(librariesPath, lib);
        if (lib.endsWith('.json')) {
          try {
            const libArtifact = JSON.parse(fs.readFileSync(libPath, 'utf8'));
            if (libArtifact.deployedBytecode) {
              const libSize = libArtifact.deployedBytecode.length / 2 - 1;
              console.log(`${lib.replace('.json', '')}: ${libSize} bytes`);
            } else {
              console.log(`${lib.replace('.json', '')}: No deployedBytecode`);
            }
          } catch (err) {
            console.log(`Error reading ${lib}: ${err.message}`);
          }
        } else if (fs.statSync(libPath).isDirectory()) {
          const libFiles = fs.readdirSync(libPath);
          for (const file of libFiles) {
            if (file.endsWith('.json')) {
              try {
                const fileArtifact = JSON.parse(fs.readFileSync(path.join(libPath, file), 'utf8'));
                if (fileArtifact.deployedBytecode) {
                  const fileSize = fileArtifact.deployedBytecode.length / 2 - 1;
                  console.log(`${file.replace('.json', '')}: ${fileSize} bytes`);
                } else {
                  console.log(`${file.replace('.json', '')}: No deployedBytecode`);
                }
              } catch (err) {
                console.log(`Error reading ${file}: ${err.message}`);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error reading libraries directory: ${err.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 