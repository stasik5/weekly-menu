/**
 * GitHub Auto-Publisher - Publishes generated menu to GitHub
 * Handles copying to docs/, git commit, and push
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Copy generated HTML to docs/ directory
 * @param {string} sourcePath - Source HTML file path
 * @param {string} docsPath - Destination docs path (typically 'docs/index.html')
 * @returns {boolean} Success status
 */
function copyToDocs(sourcePath, docsPath) {
  try {
    console.log('\n📁 Copying to docs/...');

    // Ensure docs directory exists
    const docsDir = path.dirname(docsPath);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Copy the file
    fs.copyFileSync(sourcePath, docsPath);
    console.log(`✓ Copied to: ${docsPath}`);

    return true;
  } catch (error) {
    console.error('Error copying to docs:', error.message);
    return false;
  }
}

/**
 * Check git status
 * @returns {Object} Git status info
 */
function getGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();

    return {
      hasChanges: status.trim().length > 0,
      branch: branch,
      remote: remote,
      status: status
    };
  } catch (error) {
    console.error('Error getting git status:', error.message);
    return {
      hasChanges: false,
      branch: 'unknown',
      remote: 'unknown',
      status: ''
    };
  }
}

/**
 * Stage and commit changes
 * @param {string} message - Commit message
 * @returns {boolean} Success status
 */
function commitChanges(message) {
  try {
    console.log('\n📝 Committing changes...');

    // Stage all changes
    execSync('git add -A', { encoding: 'utf8' });
    console.log('✓ Staged changes');

    // Commit
    execSync(`git commit -m "${message}"`, { encoding: 'utf8' });
    console.log(`✓ Committed: ${message}`);

    return true;
  } catch (error) {
    if (error.message.includes('nothing to commit')) {
      console.log('No changes to commit');
      return true;
    }
    console.error('Error committing:', error.message);
    return false;
  }
}

/**
 * Pull latest changes from remote
 * @returns {boolean} Success status
 */
function pullChanges() {
  try {
    console.log('\n⬇️ Pulling latest changes...');

    execSync('git pull --rebase', { encoding: 'utf8' });
    console.log('✓ Pull complete');

    return true;
  } catch (error) {
    console.error('Error pulling:', error.message);
    console.log('Continuing anyway...');
    return false;
  }
}

/**
 * Push changes to remote
 * @returns {boolean} Success status
 */
function pushChanges() {
  try {
    console.log('\n⬆️ Pushing to GitHub...');

    execSync('git push', { encoding: 'utf8' });
    console.log('✓ Pushed successfully');

    return true;
  } catch (error) {
    console.error('Error pushing:', error.message);
    return false;
  }
}

/**
 * Handle merge conflicts
 * @returns {boolean} Success status
 */
function resolveConflicts() {
  try {
    console.log('\n⚠️ Attempting to resolve conflicts...');

    // Check if there are conflicts
    const status = execSync('git status --porcelain', { encoding: 'utf8' });

    if (status.includes('UU') || status.includes('AA')) {
      console.log('Merge conflicts detected. Using "theirs" strategy for docs/...');
      execSync('git checkout --theirs docs/', { encoding: 'utf8' });
      execSync('git add docs/', { encoding: 'utf8' });
      execSync('git commit --no-edit', { encoding: 'utf8' });
      console.log('✓ Conflicts resolved');
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error resolving conflicts:', error.message);
    return false;
  }
}

/**
 * Publish to GitHub
 * @param {string} htmlPath - Path to generated HTML
 * @param {string} weekLabel - Week label (e.g., "2026-W05")
 * @returns {Promise<Object>} Result object
 */
async function publishToGitHub(htmlPath, weekLabel) {
  const result = {
    success: false,
    copied: false,
    committed: false,
    pushed: false,
    error: null
  };

  try {
    console.log('\n' + '='.repeat(50));
    console.log('GitHub Auto-Publisher');
    console.log('='.repeat(50));

    // Change to project directory if needed
    const projectDir = path.dirname(path.dirname(htmlPath));
    if (process.cwd() !== projectDir) {
      process.chdir(projectDir);
      console.log(`Working directory: ${projectDir}`);
    }

    // Step 1: Copy to docs/
    const docsPath = path.join(projectDir, 'docs', 'index.html');
    result.copied = copyToDocs(htmlPath, docsPath);

    if (!result.copied) {
      throw new Error('Failed to copy to docs/');
    }

    // Step 2: Check git status
    const gitStatus = getGitStatus();
    console.log(`\nGit status:`);
    console.log(`  Branch: ${gitStatus.branch}`);
    console.log(`  Remote: ${gitStatus.remote}`);
    console.log(`  Changes: ${gitStatus.hasChanges ? 'Yes' : 'No'}`);

    // Step 3: Pull latest
    await pullChanges();

    // Step 4: Commit changes
    const commitMessage = `Update weekly menu for ${weekLabel}`;
    result.committed = commitChanges(commitMessage);

    if (!result.committed) {
      throw new Error('Failed to commit changes');
    }

    // Step 5: Push to GitHub
    result.pushed = pushChanges();

    if (!result.pushed) {
      throw new Error('Failed to push to GitHub');
    }

    result.success = true;

    console.log('\n' + '='.repeat(50));
    console.log('✅ PUBLISH COMPLETE');
    console.log('='.repeat(50));
    console.log(`Week: ${weekLabel}`);
    console.log(`URL: ${gitStatus.remote.replace('.git', '')}`);
    console.log('='.repeat(50));

  } catch (error) {
    result.error = error.message;
    console.error('\n❌ Publishing failed:', error.message);
  }

  return result;
}

/**
 * Verify GitHub Pages settings
 * @returns {boolean} True if properly configured
 */
function verifyGitHubPages() {
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    console.log(`\nGitHub Repository: ${remote}`);

    if (remote.includes('github.com')) {
      console.log('✓ GitHub repository detected');
      console.log('Note: Make sure GitHub Pages is enabled in repo settings');
      console.log('  Source: Deploy from a branch');
      console.log('  Branch: main (or master)');
      console.log('  Folder: /docs (root)');
      return true;
    }

    console.log('⚠️ Not a GitHub repository');
    return false;
  } catch (error) {
    console.error('Error verifying GitHub:', error.message);
    return false;
  }
}

module.exports = {
  copyToDocs,
  getGitStatus,
  commitChanges,
  pullChanges,
  pushChanges,
  resolveConflicts,
  publishToGitHub,
  verifyGitHubPages
};
