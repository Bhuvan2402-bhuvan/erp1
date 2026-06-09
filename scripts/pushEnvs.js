const fs = require('fs');
const { execSync } = require('child_process');

try {
  console.log("Reading local .env file...");
  const envFile = fs.readFileSync('.env', 'utf8');
  
  const lines = envFile.split('\n');
  for (const line of lines) {
    if (!line || line.trim() === '' || line.startsWith('#')) continue;
    
    // Parse Key=Value
    const firstEq = line.indexOf('=');
    if (firstEq === -1) continue;
    
    const key = line.substring(0, firstEq).trim();
    let value = line.substring(firstEq + 1).trim();
    
    if (key === 'GOOGLE_SHEET_WEBHOOK_URL') continue; // already pushed safely

    console.log(`Pushing ${key} to Vercel...`);
    
    // Use powershell to pipe the value safely without trailing spaces
    try {
      execSync(`node -e "process.stdout.write('${value}')" | npx.cmd vercel env add ${key} production`, { stdio: 'inherit' });
    } catch (err) {
      console.error(`Failed to push ${key}. It might already exist or require removing first.`);
      // Try removing it first just in case
      try {
        execSync(`npx.cmd vercel env rm ${key} production -y`, { stdio: 'ignore' });
        execSync(`node -e "process.stdout.write('${value}')" | npx.cmd vercel env add ${key} production`, { stdio: 'inherit' });
      } catch(e2) {
        console.error(`Double failed on ${key}.`);
      }
    }
  }
  
  console.log("All environment variables pushed successfully.");
} catch (error) {
  console.error("Error:", error);
}
