// ==UserScript==
// @name         GitHub Mash
// @version      0.0.1
// @description  Set your PR default GitHub Merge or Squash button based on where you are merging into
// @match https://github.com/*
// @license MIT
// @author robf-github
// @grant none
// ==/UserScript==

(function () {
    'use strict';

    console.log('GitMash loaded');

    // Add custom CSS to style the buttons and summary element
    const style = document.createElement('style');
    style.textContent = `
        .merge-box-button,
        .select-menu-button {
            background-color: #6A0DAD !important; /* Purple */
        }
    `;
    document.head.appendChild(style);

    // Handle the SPA nature of github, listen for navigation changes and act on those.
    window.navigation.addEventListener("navigate", (event) => {
        if (event.navigationType === 'replace') {
            gitMash();
        }
    });
})();

let observer;

function gitMash() {
    if (observer) {
        observer.disconnect();
        observer = undefined;
        console.log('GitMash not listening...');
    }

    if (window.location.href.match('https:\/\/github.com\/.*?\/pull\/.*') == null) {
        return;
    }

    console.log(window.location.href);

    const developBranch = 'develop';
    const featureBranchPrefix = 'feature/';

    const baseBranch = document.querySelector('.base-ref').textContent;
    const headBranch = document.querySelector('.head-ref').textContent;

    if (!baseBranch || !headBranch) {
        return;
    }

    let selector;
    if (baseBranch === developBranch && headBranch.startsWith(featureBranchPrefix)) {
        selector = '.js-merge-box-button-squash';
    } else {
        selector = '.js-merge-box-button-merge';
    }

    let element = document.querySelector(selector);

    if (element) {
        selectGitMash(element);
    } else {
        observer = new MutationObserver(_ => {
            let element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                observer = undefined;
                selectGitMash(element);
                console.log('GitMash not listening...')
            }
        });
        console.log('GitMash listening...');
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

function selectGitMash(element) {
    element.click();
    console.log(element.textContent + ' selected!');
}
