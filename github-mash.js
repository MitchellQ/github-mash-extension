// ==UserScript==
// @name         GitHub Mash
// @version      1.5.6
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

const isDebug = false;
const changeBtnColour = true;
const version = '1.5.6';
const DEVELOP_BRANCH = 'develop';
const FEATURE_PREFIX = 'feature/';

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
    console.warn(
      'GitMash: Not on a Pull Request page, skipping initialization.'
    );
    return;
  }
  console.log(`Current URL: ${window.location.href}`);

  if (changeBtnColour) {
    styleMergeButton();
  }

  baseBranch = document.querySelector('.base-ref').textContent;
  headBranch = document.querySelector('.head-ref').textContent;
  if (!baseBranch || !headBranch) {
    console.warn('Base or head branch not found.');
    return;
  }

  isFeatureMerge =
    baseBranch === DEVELOP_BRANCH && headBranch.startsWith(FEATURE_PREFIX);

  observeForButton(
    'button.prc-Button-ButtonBase-c50BI[data-variant="primary"]',
    'merge'
  );

  observeForElement(
    '[aria-label="Select merge method"]',
    openDropDown,
    'merge dropdown button'
  );
}

function styleMergeButton() {
  // Add custom CSS to style the buttons and summary element
  const style = document.createElement('style');
  style.textContent = `
        [aria-label="Select merge method"]:enabled,
        button.prc-Button-ButtonBase-c50BI[data-variant="primary"] {
            background-color: #6A0DAD !important; /* Purple */
        }
    `;
  document.head.appendChild(style);
}

function openDropDown(element) {
  element.click();
  isDebug ? console.log('Dropdown button clicked.') : '';

  observeForElement(
    '[data-component="ActionList.Item--DividerContainer"]',
    selectGitMash,
    '3 merge buttons',
    true
  );
}

function selectGitMash(elements) {
  let selectionIndex = isFeatureMerge ? 1 : 0;
  let method = selectionIndex === 1 ? 'squash' : 'merge';

  console.log(`Selecting merge method: ${method}`);
  elements[selectionIndex]?.click();

  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 100);
}

function mergeBtnListener(btn) {
  if (!isFeatureMerge) {
    isDebug ? console.log('PR is not going into develop from feature/*') : '';
    return;
  }

  isDebug ? console.log('Merge button found') : '';

  // Remove any existing event listener to prevent duplicate bindings
  btn.removeEventListener('click', handleMergeBtnClick);
  btn.addEventListener('click', handleMergeBtnClick);
}

function handleMergeBtnClick(event) {
  isDebug ? console.log('Merge Button clicked!') : '';

  observeForElement(
    'span.TextInputWrapper__StyledTextInputBaseWrapper-sc-1mqhpbi-0.hmaawo input[data-component="input"]',
    updateCommitTitle,
    'commit title'
  );
}

function updateCommitTitle(element) {
  const issueTitleElement = document.querySelector('h1 .js-issue-title');
  const issueNumberElement = document.querySelector(
    'h1 span.f1-light.color-fg-muted'
  );

  if (!issueTitleElement || !issueNumberElement || !element) {
    console.warn('Required elements not found. Skipping merge title update.');
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
