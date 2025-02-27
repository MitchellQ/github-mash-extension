// ==UserScript==
// @name         GitHub Mash
// @version      2.1.8
// @description  Set your PR default GitHub Merge or Squash button based on where you are merging into
// and update the commit message title (when merging from feature/* into develop) if needed.
// @match https://github.com/*
// @license MIT
// @author robf-github, mitchellq
// @grant none
// ==/UserScript==
let observer;
let baseBranch;
let headBranch;
let isFeatureMerge;

const isDebug = true;
const changeBtnColour = true;
const showCustomAlert = true;
const version = '2.1.8';
const DEVELOP_BRANCH = 'develop';
const FEATURE_PREFIX = 'feature/';
const btnSelector =
  'button.prc-Button-ButtonBase-c50BI[data-variant="primary"]';

(function () {
  'use strict';
  console.log(`GitMash ${version} loaded`);

  // Handle the SPA nature of github, listen for navigation changes and act on those.
  window.navigation.addEventListener('navigate', (event) => {
    if (event.navigationType === 'replace') {
      gitMash();
    }
  });
})();

function gitMash() {
  if (window.location.href.match('https://github.com/.*?/pull/.*') == null) {
    console.log(
      'GitMash: Not on a Pull Request page, skipping initialization.'
    );
    return;
  }
  console.log(`Current URL: ${window.location.href}`);

  baseBranch = document.querySelector('.base-ref').textContent;
  headBranch = document.querySelector('.head-ref').textContent;
  if (!baseBranch || !headBranch) {
    console.log('Base or head branch not found.');
    return;
  }

  isFeatureMerge =
    baseBranch === DEVELOP_BRANCH && headBranch.startsWith(FEATURE_PREFIX);

  observeForButton(btnSelector, 'merge');

  observeForElement(
    '.p-3.bgColor-muted.borderColor-muted.rounded-bottom-2',
    addWarningBox,
    'add warning box'
  );
}

function addWarningBox(element) {
  let message = isFeatureMerge
    ? 'Squash into Develop'
    : 'Merge into Release/* and Main';

  let warningBox = document.querySelector('#warning-box');

  if (!warningBox) {
    isDebug ? console.log('Adding warning box') : '';
    element.insertAdjacentHTML(
      'afterbegin',
      `<div class="p-3 mb-3 rounded-bottom-2" id"warning-box" style="background-color: rgba(58, 28, 117, 0.2); color: #FFFFFF; border: 1px solid #6A0DAD;">
        ⚠ Warning: ${message}
      </div>`
    );
  } else {
    isDebug ? console.log('Warning box already exists.') : '';
  }
}

function mergeBtnListener(btn) {
  if (!isFeatureMerge) {
    isDebug ? console.log('PR is not going into develop from feature/*') : '';
    return;
  } else {
    isDebug ? console.log('PR is going into develop from feature/*') : '';

    isDebug ? console.log('Merge button found') : '';

    // Remove any existing event listener to prevent duplicate bindings
    btn.removeEventListener('click', handleMergeBtnClick); // No need to call it, just pass the function
    btn.addEventListener('click', handleMergeBtnClick); // Add it as a reference
  }
}

function handleMergeBtnClick() {
  isDebug ? console.log('Merge Button clicked!') : '';

  const btn = document.querySelector(btnSelector);
  if (btn.textContent === 'Merge pull request') {
    isDebug ? console.log('Squash not selected') : '';
    if (showCustomAlert) {
      showAlert('Squash and merge is not selected!');
    }
  } else {
    isDebug ? console.log('Squash selected') : '';

    observeForElement(
      'span.TextInputWrapper__StyledTextInputBaseWrapper-sc-1mqhpbi-0.hmaawo input[data-component="input"]',
      updateCommitTitle,
      'commit title'
    );
  }
}

// Function to show custom alert
function showAlert(message) {
  console.log('here');
  styleAlert();

  // Create a div for the custom alert
  const alertDiv = document.createElement('div');
  alertDiv.className = 'custom-alert rounded-bottom-2';

  // Add message to the alert
  const alertMessage = document.createElement('span');
  alertMessage.textContent = message;
  alertDiv.appendChild(alertMessage);

  // Create the close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.className = 'close-btn';

  // Add click event to close the alert
  closeButton.addEventListener('click', () => {
    alertDiv.remove();
  });

  // Append the close button to the alert
  alertDiv.appendChild(closeButton);

  // Append the alert div to the body
  document.body.appendChild(alertDiv);
}

// Function to add styles for the alert and close button
function styleAlert() {
  const style = document.createElement('style');
  style.textContent = `
    .custom-alert {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(58, 28, 117, 0.8);
      color: white;
      padding: 16px;
      border: 1px solid #6A0DAD;
      border-radius: 8px;
      font-size: 16px;
      box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: space-between; /* Space between text and button */
      width: auto;
      max-width: 400px;
    }

    /* Optional: Add an icon for the alert */
    .custom-alert::before {
      content: "⚠";
      margin-right: 8px;
      font-size: 20px;
    }

    /* Style for the close button */
    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0 8px;
      margin-left: 16px;
      transition: color 0.3s;
    }

    /* Hover effect for close button */
    .close-btn:hover {
      color: #000;
    }
  `;
  document.head.appendChild(style);
}

function updateCommitTitle(element) {
  isDebug ? console.log('Updating commit title') : '';
  const issueTitleElement = document.querySelector('h1 .js-issue-title');
  const issueNumberElement = document.querySelector(
    'h1 span.f1-light.color-fg-muted'
  );

  if (!issueTitleElement || !issueNumberElement || !element) {
    console.log('Required elements not found. Skipping merge title update.');
    return;
  }

  // Note there are two spaces between the issue title and number
  const newCommitTitle = `${issueTitleElement.textContent.trim()}  (${issueNumberElement.textContent.trim()})`;
  if (element.value === newCommitTitle) {
    console.log('No need to update commit title');
  } else {
    console.log(
      `Updated Merge title from: ${element.value} to ${newCommitTitle}`
    );
    element.value = newCommitTitle;
  }
}

// Observe for the button's existence
function observeForButton(selector, message) {
  const observer = new MutationObserver((mutations, obs) => {
    const btn = document.querySelector(selector);
    if (btn) {
      mergeBtnListener(btn);
      obs.disconnect();
    }
  });

  isDebug ? console.log(`Listening for the ${message} button...`) : '';
  observer.observe(document.body, { childList: true, subtree: true });
}

function observeForElement(selector, callback, message, selectAll = false) {
  const observer = new MutationObserver((mutations, obs) => {
    const elements = selectAll
      ? document.querySelectorAll(selector)
      : document.querySelector(selector);

    if (selectAll ? elements.length > 0 : elements) {
      obs.disconnect();
      callback(elements);
      isDebug ? console.log(`GitMash stopped listening to the ${message}`) : '';
    }
  });
  isDebug ? console.log(`GitMash listening to the ${message}...`) : '';
  observer.observe(document.body, { childList: true, subtree: true });
}
