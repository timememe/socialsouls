// content.js
console.log('Social Souls initialized');

// Словарь сообщений
const messages = {
  mail_sent: {
      ru: 'ПИСЬМО ОТПРАВЛЕНО',
      en: 'MAIL SENT'
  },
  mail_deleted: {
      ru: 'ДУША ПОГЛОЩЕНА',
      en: 'SOUL CONSUMED'
  },
  attachment_added: {
      ru: 'СНАРЯЖЕНИЕ ИЗМЕНЕНО',
      en: 'EQUIPMENT CHANGED'
  },
  like_given: {
      ru: 'ПОХВАЛА ОСТАВЛЕНА',
      en: 'PRAISE BESTOWED'
  },
  like_removed: {
      ru: 'ПОХВАЛА ОТОЗВАНА',
      en: 'PRAISE WITHDRAWN'
  },
  dislike_given: {
      ru: 'ПОРИЦАНИЕ ВЫНЕСЕНО',
      en: 'JUDGMENT PASSED'
  },
  dislike_removed: {
      ru: 'ПОРИЦАНИЕ ОТМЕНЕНО',
      en: 'JUDGMENT WITHDRAWN'
  },
  comment_posted: {
      ru: 'ПОСЛАНИЕ НАЧЕРТАНО',
      en: 'MESSAGE CARVED'
  },
  channel_subscribed: {
      ru: 'ПРИСОЕДИНИЛСЯ К КОВЕНАНТУ',
      en: 'COVENANT JOINED'
  },
  channel_unsubscribed: {
      ru: 'ПОКИНУЛ КОВЕНАНТ',
      en: 'COVENANT ABANDONED'
  },
  playlist_added: {
      ru: 'ПРЕДМЕТ ПОЛУЧЕН',
      en: 'ITEM ACQUIRED'
  },
  dtf_post_published: {
        ru: 'СВИТОК ОПУБЛИКОВАН',
        en: 'SCROLL PUBLISHED'
    },
    dtf_comment_posted: {
        ru: 'ПОСЛАНИЕ НАЧЕРТАНО',
        en: 'MESSAGE INSCRIBED'
    },
    dtf_like_given: {
        ru: 'ОДОБРЕНИЕ ДАРОВАНО',
        en: 'PRAISE GRANTED'
    },
    dtf_like_removed: {
        ru: 'ОДОБРЕНИЕ ОТОЗВАНО',
        en: 'PRAISE WITHDRAWN'
    },
    reddit_upvote_given: {
        ru: 'БЛАГОСЛОВЕНИЕ ДАРОВАНО',
        en: 'BLESSING BESTOWED'
    },
    reddit_upvote_removed: {
        ru: 'БЛАГОСЛОВЕНИЕ ОТОЗВАНО',
        en: 'BLESSING WITHDRAWN'
    },
    reddit_downvote_given: {
        ru: 'ПРОКЛЯТИЕ НАЛОЖЕНО',
        en: 'CURSE INFLICTED'
    },
    reddit_downvote_removed: {
        ru: 'ПРОКЛЯТИЕ СНЯТО',
        en: 'CURSE LIFTED'
    },
    reddit_comment_posted: {
        ru: 'СВИТОК НАПИСАН',
        en: 'SCROLL INSCRIBED'
    },
    reddit_post_submitted: {
        ru: 'МАНИФЕСТ ПРОВОЗГЛАШЕН',
        en: 'MANIFESTO PROCLAIMED'
    },
    reddit_save_added: {
        ru: 'АРТЕФАКТ СОХРАНЕН',
        en: 'ARTIFACT PRESERVED'
    },
    reddit_save_removed: {
        ru: 'АРТЕФАКТ ОТВЕРГНУТ',
        en: 'ARTIFACT DISCARDED'
    }
};

// Общие утилиты
const utils = {
    detectLanguage() {
        // Сначала проверяем сохраненные настройки
        return new Promise((resolve) => {
            chrome.storage.sync.get({
                language: 'en'  // значение по умолчанию
            }, function(items) {
                resolve(items.language);
            });
        });
    },

    async getMessage(key) {
        const lang = await this.detectLanguage();
        if (!messages[key]) {
            console.warn(`Message key "${key}" not found in messages dictionary`);
            return key;
        }
        return messages[key][lang] || messages[key]['en'] || key;
    },

    async addSouls(amount) {
        console.log('Adding souls:', amount);
        chrome.storage.sync.get({ soulsCount: 0 }, function(items) {
            const newCount = Math.max(0, items.soulsCount + amount); // Не даём уйти в минус
            console.log('New souls count:', newCount);
            chrome.storage.sync.set({ soulsCount: newCount });
        });
    },

    showNotification(text, type = 'victory') {
        chrome.storage.sync.get({
            youtubeEnabled: true,
            gmailEnabled: true,
            redditEnabled: true,
            dtfEnabled: true,
            soundEnabled: true,
            soundVolume: 50
        }, async function(settings) {
            const isYoutube = window.location.hostname.includes('youtube.com');
            const isGmail = window.location.hostname.includes('mail.google.com');
            const isReddit = window.location.hostname.includes('reddit.com');
            const isDtf = window.location.hostname.includes('dtf.ru');
            
            if ((isYoutube && !settings.youtubeEnabled) || 
                (isGmail && !settings.gmailEnabled) ||
                (isReddit && !settings.redditEnabled) ||
                (isDtf && !settings.dtfEnabled)) {
                return;
            }

            const localizedText = await utils.getMessage(text);

            // Показываем уведомление
            const overlay = document.createElement('div');
            overlay.className = 'souls-overlay';
            document.body.appendChild(overlay);
            
            const notification = document.createElement('div');
            notification.className = `souls-notification ${type}`;
            notification.textContent = localizedText;
            document.body.appendChild(notification);

            // Обновлённая логика начисления душ
            if (text.includes('_removed')) {
                // За отмену любого действия снимаем 50 душ
                this.addSouls(-50);
            } else if (type === 'victory') {
                // За позитивные действия (апвоуты, комментарии, etc)
                this.addSouls(100);
            } else if (type === 'death') {
                // За негативные действия (даунвоуты)
                this.addSouls(50);
            }

            let sound;
            if (settings.soundEnabled) {
                sound = new Audio(chrome.runtime.getURL(`sounds/${type}.mp3`));
                sound.volume = settings.soundVolume / 100;
                sound.play().catch(err => console.log('Sound playback failed:', err));
                
                setTimeout(() => {
                    const fadeInterval = setInterval(() => {
                        if (sound.volume > 0.1) {
                            sound.volume -= 0.1;
                        } else {
                            sound.pause();
                            clearInterval(fadeInterval);
                        }
                    }, 100);
                }, 1500);
            }
            
            requestAnimationFrame(() => {
                overlay.classList.add('show');
                notification.classList.add('show');
            });

            setTimeout(() => {
                overlay.classList.remove('show');
                notification.classList.remove('show');
                setTimeout(() => {
                    overlay.remove();
                    notification.remove();
                }, 1000);
            }, 2000);
        }.bind(this));
    }
};

// Обработчики для каждого сайта
const handlers = {
    youtube: {
        initialize() {
            console.log('YouTube Souls initialized');
            this.addButtonListeners();
            this.addCommentListeners();
            this.addSubscriptionListeners();
            this.addPlaylistListeners();
            this.observeDynamicContent();
        },

        addButtonListeners() {
            const likeSelectors = [
                'ytd-menu-renderer ytd-toggle-button-renderer:first-child',
                'ytd-like-button-renderer',
                'like-button-view-model',
                '#like-button',
                '#top-level-buttons-computed > ytd-toggle-button-renderer:first-child'
            ];

            const dislikeSelectors = [
                'ytd-menu-renderer ytd-toggle-button-renderer:nth-child(2)',
                'ytd-dislike-button-renderer',
                'dislike-button-view-model',
                '#dislike-button',
                '#top-level-buttons-computed > ytd-toggle-button-renderer:nth-child(2)'
            ];

            document.addEventListener('click', (e) => {
                const likeButton = e.target.closest(likeSelectors.join(','));
                const dislikeButton = e.target.closest(dislikeSelectors.join(','));

                if (likeButton || dislikeButton) {
                    const isLike = !!likeButton;
                    const button = likeButton || dislikeButton;

                    setTimeout(() => {
                        const isActive = (
                            button.getAttribute('aria-pressed') === 'true' ||
                            button.classList.contains('style-default-active') ||
                            button.querySelector('[aria-pressed="true"]') ||
                            button.matches('[aria-pressed="true"]') ||
                            button.querySelector('.yt-spec-button-shape-next--tonal-active')
                        );

                        utils.showNotification(
                            isLike ? (isActive ? 'like_given' : 'like_removed')
                                 : (isActive ? 'dislike_given' : 'dislike_removed'),
                            isLike ? (isActive ? 'victory' : 'neutral')
                                 : (isActive ? 'death' : 'neutral')
                        );
                    }, 100);
                }
            }, true);
        },

        addCommentListeners() {
            document.addEventListener('click', (e) => {
                const commentButton = e.target.closest([
                    'button[aria-label*="Комментировать"]',
                    'button[aria-label*="Comment"]',
                    'ytd-button-renderer[aria-label*="Comment"]',
                    '#submit-button'
                ].join(','));
                
                if (commentButton) {
                    const commentBox = commentButton.closest('ytd-comments, ytd-comment-dialog-renderer, ytd-comment-simplebox-renderer');
                    const commentText = commentBox?.querySelector('#contenteditable-root, #contenteditable')?.textContent?.trim();

                    if (commentText) {
                        setTimeout(() => {
                            utils.showNotification('comment_posted', 'victory');
                        }, 100);
                    }
                }
            }, true);
        },

        addSubscriptionListeners() {
            document.addEventListener('click', (e) => {
                const subscribeButton = e.target.closest([
                    'button[aria-label*="Subscribe"]',
                    'button[aria-label*="Подписаться"]',
                    'ytd-button-renderer[aria-label*="Subscribe"]',
                    'ytd-button-renderer[aria-label*="Подписаться"]'
                ].join(','));

                if (subscribeButton) {
                    setTimeout(() => {
                        const isSubscribed = (
                            subscribeButton.getAttribute('aria-pressed') === 'true' ||
                            subscribeButton.classList.contains('subscribed') ||
                            subscribeButton.querySelector('[aria-label*="Отписаться"]') ||
                            subscribeButton.querySelector('[aria-label*="Unsubscribe"]')
                        );

                        utils.showNotification(
                            isSubscribed ? 'channel_subscribed' : 'channel_unsubscribed',
                            isSubscribed ? 'victory' : 'neutral'
                        );
                    }, 100);
                }
            }, true);
        },

        addPlaylistListeners() {
            document.addEventListener('click', (e) => {
                const playlistButton = e.target.closest([
                    'button[aria-label*="Save to playlist"]',
                    'button[aria-label*="Сохранить в плейлист"]',
                    'ytd-button-renderer[aria-label*="playlist"]',
                    'ytd-button-renderer[aria-label*="плейлист"]'
                ].join(','));

                if (playlistButton) {
                    setTimeout(() => {
                        utils.showNotification('playlist_added', 'victory');
                    }, 100);
                }
            }, true);
        },

        observeDynamicContent() {
            const observer = new MutationObserver(() => {});
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    },

    gmail: {
        initialize() {
            console.log('Gmail Souls initialized');
            this.addSendListeners();
            this.addAttachmentListeners();
            this.addDeleteListeners();
            this.addKeyboardListeners();
        },

        addSendListeners() {
            document.addEventListener('click', (e) => {
                const isGmailSendButton = (
                    e.target.innerText === 'Send' ||
                    e.target.innerText === 'Отправить' ||
                    e.target.getAttribute('aria-label')?.includes('Send') ||
                    e.target.getAttribute('aria-label')?.includes('Отправить') ||
                    e.target.closest('[role="button"][aria-label*="Send"]') ||
                    e.target.closest('[role="button"][aria-label*="Отправить"]') ||
                    e.target.closest('[data-tooltip="Send"]') ||
                    e.target.closest('[data-tooltip="Отправить"]') ||
                    e.target.closest('[command="Send"]') ||
                    e.target.closest('[command="Отправить"]')
                );

                if (isGmailSendButton) {
                    setTimeout(() => {
                        utils.showNotification('mail_sent', 'victory');
                    }, 100);
                }
            }, true);
        },

        addAttachmentListeners() {
            document.addEventListener('click', (e) => {
                const attachmentButton = e.target.closest([
                    'button[aria-label*="Add attachment"]',
                    'button[aria-label*="Прикрепить файл"]',
                    '[command="Files"]'
                ].join(','));

                if (attachmentButton) {
                    setTimeout(() => {
                        utils.showNotification('attachment_added', 'victory');
                    }, 100);
                }
            }, true);
        },

        addDeleteListeners() {
            document.addEventListener('click', (e) => {
                const deleteButton = e.target.closest([
                    'button[aria-label*="Delete"]',
                    'button[aria-label*="Удалить"]',
                    '[command="Delete"]'
                ].join(','));

                if (deleteButton) {
                    setTimeout(() => {
                        utils.showNotification('mail_deleted', 'death');
                    }, 100);
                }
            }, true);
        },

        addKeyboardListeners() {
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    const composeBox = document.querySelector('div[role="dialog"]');
                    const isComposing = composeBox && (
                        composeBox.getAttribute('aria-label')?.toLowerCase().includes('compose') ||
                        composeBox.getAttribute('aria-label')?.toLowerCase().includes('создать') ||
                        composeBox.getAttribute('aria-label')?.toLowerCase().includes('написать')
                    );
                    
                    if (isComposing) {
                        setTimeout(() => {
                            utils.showNotification('mail_sent', 'victory');
                        }, 100);
                    }
                }
            });
        }
    },

    dtf: {
        initialize() {
            console.log('DTF Souls initialized');
            this.addLikeListeners();
            this.addCommentListeners();
            this.addPostListeners();
        },
    
        addLikeListeners() {
            document.addEventListener('click', (e) => {
                const likeButton = e.target.closest([
                    '.reaction-button',
                    '.comment__vote-button', 
                    '.vote-button',
                    '.comments__item .vote__value',
                    '.comments__item .vote__button',
                    '.content-container .vote-button',
                    '.content-header .vote-button',
                    '[data-role="vote"]',
                    '.vote__button',
                    '.voting__button'
                ].join(','));
        
                if (likeButton) {
                    console.log('DTF like button clicked:', likeButton);
                    
                    setTimeout(() => {
                        const isLiked = 
                            likeButton.classList.contains('reaction-button--active') ||
                            likeButton.classList.contains('vote__button--active') ||
                            likeButton.classList.contains('voting__button--active') ||
                            likeButton.classList.contains('comment__vote-button--active') ||
                            likeButton.classList.contains('vote-button--active') ||
                            likeButton.getAttribute('data-voted') === 'true' ||
                            likeButton.closest('.vote--voted');
        
                        utils.showNotification(
                            isLiked ? 'dtf_like_given' : 'dtf_like_removed',
                            isLiked ? 'victory' : 'neutral'
                        );
                    }, 100);
                }
            }, true);
        },
    
        addCommentListeners() {
            document.addEventListener('click', (e) => {
                const commentButton = e.target.closest('.button--type-primary[data-gtm-click*="New Comment"]');
        
                if (commentButton) {
                    console.log('DTF comment button clicked:', commentButton);
                    
                    // Показываем уведомление сразу после клика, если кнопка не disabled
                    if (!commentButton.disabled) {
                        setTimeout(() => {
                            utils.showNotification('dtf_comment_posted', 'victory');
                        }, 100);
                    }
                }
            }, true);
        
            // Оставляем также поддержку Ctrl+Enter
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    const commentForm = e.target.closest('form');
                    if (commentForm && !commentForm.querySelector('button[disabled]')) {
                        utils.showNotification('dtf_comment_posted', 'victory');
                    }
                }
            }, true);
        },
    
        addPostListeners() {
            document.addEventListener('click', (e) => {
                const publishButton = e.target.closest([
                    '.editor__submit-button',
                    '.editor-footer__submit',
                    'button[data-type="publish"]',
                    '.writearea__submit',
                    '.ui-button[title="Опубликовать"]'
                ].join(','));
    
                if (publishButton) {
                    console.log('DTF publish button clicked:', publishButton);
                    utils.showNotification('dtf_post_published', 'victory');
                }
            }, true);
        }
    },

    reddit: {
        initialize() {
            console.log('Reddit Souls initializing...');
            
            chrome.storage.sync.get({ redditEnabled: true }, function(items) {
                if (items.redditEnabled) {
                    console.log('Reddit Souls is enabled');
                    this._initializeHandlers();
                    setTimeout(() => {
                        this._scanForButtons();
                    }, 2000);
                }
            }.bind(this));
        },
    
        _scanForButtons() {
            console.log('Scanning for Reddit buttons...');
            
            // Ищем все shadow root контейнеры
            const shadowHosts = document.querySelectorAll('shreddit-post, shreddit-comment, shreddit-comment-action-row');
            console.log(`Found ${shadowHosts.length} shadow hosts`);
    
            shadowHosts.forEach(host => {
                if (host.shadowRoot) {
                    const buttons = host.shadowRoot.querySelectorAll('button');
                    buttons.forEach(button => {
                        console.log('Found button in shadow DOM:', {
                            host: host.tagName,
                            button: button.outerHTML,
                        });
                    });
                }
            });
        },
    
        _initializeHandlers() {
            console.log('Initializing handlers...');
            
            // Обработчик голосования
            document.addEventListener('click', (e) => {
                this._handleVoteClick(e);
                this._handleCommentSubmit(e);
            }, true);
    
            // Обработчик для Ctrl+Enter
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    this._handleCommentSubmit(e);
                }
            }, true);
        },
    
        _handleVoteClick(e) {
            const shadowHost = e.target.closest('shreddit-post, shreddit-comment, shreddit-comment-action-row');
            if (!shadowHost) return;
    
            const path = e.composedPath();
            const voteButton = path.find(el => {
                if (el instanceof HTMLButtonElement) {
                    const hasVoteSvg = el.querySelector('svg[icon-name*="vote"]');
                    const hasScreenReader = el.querySelector('faceplate-screen-reader-content');
                    return hasVoteSvg || 
                           (hasScreenReader && hasScreenReader.textContent.toLowerCase().includes('vote'));
                }
                return false;
            });
    
            if (!voteButton) return;
    
            const isUpvote = 
                voteButton.querySelector('svg[icon-name*="upvote"]') ||
                voteButton.querySelector('faceplate-screen-reader-content')?.textContent.toLowerCase().includes('upvote');
    
            // Сохраняем начальное состояние кнопки
            const wasPressed = voteButton.getAttribute('aria-pressed') === 'true';
            const wasSecondary = voteButton.classList.contains('button-secondary');
            
            setTimeout(() => {
                // Проверяем новое состояние кнопки
                const isPressed = voteButton.getAttribute('aria-pressed') === 'true';
                const isSecondary = voteButton.classList.contains('button-secondary');
    
                console.log('Vote button states:', {
                    wasPressed,
                    isPressed,
                    wasSecondary,
                    isSecondary,
                    isUpvote,
                    classes: Array.from(voteButton.classList)
                });
    
                let action, type;
    
                // Если кнопка была нажата и стала ненажатой - это отмена
                if (wasPressed && !isPressed) {
                    action = isUpvote ? 'reddit_upvote_removed' : 'reddit_downvote_removed';
                    type = 'neutral';
                }
                // Если кнопка не была нажата и стала нажатой - это новое действие
                else if (!wasPressed && isPressed) {
                    action = isUpvote ? 'reddit_upvote_given' : 'reddit_downvote_given';
                    type = isUpvote ? 'victory' : 'death';
                }
                // Если было secondary и стало не secondary - это новое действие
                else if (wasSecondary && !isSecondary) {
                    action = isUpvote ? 'reddit_upvote_given' : 'reddit_downvote_given';
                    type = isUpvote ? 'victory' : 'death';
                }
                // Если было не secondary и стало secondary - это отмена
                else if (!wasSecondary && isSecondary) {
                    action = isUpvote ? 'reddit_upvote_removed' : 'reddit_downvote_removed';
                    type = 'neutral';
                }
    
                if (action && type) {
                    console.log('Sending notification:', { action, type });
                    utils.showNotification(action, type);
                }
            }, 200);
        },
    
        _handleCommentSubmit(e) {
            const path = e.composedPath();
            const submitButton = path.find(el => {
                if (el instanceof HTMLButtonElement) {
                    const hasCommentText = el.textContent?.toLowerCase().includes('comment');
                    const hasSubmitType = el.getAttribute('type') === 'submit';
                    const isInCommentForm = el.closest('faceplate-form[action*="create-comment"]') ||
                                          el.closest('form[action*="create-comment"]');
                    return (hasCommentText || hasSubmitType) && isInCommentForm;
                }
                return false;
            });
    
            if (!submitButton) return;
    
            const commentForm = submitButton.closest('faceplate-form') || submitButton.closest('form');
            if (!commentForm) return;
    
            const textArea = commentForm.querySelector('textarea, [contenteditable="true"], [role="textbox"]');
            if (!textArea) return;
    
            const commentText = textArea.value || textArea.textContent;
            if (!commentText?.trim()) return;
    
            let notificationShown = false;
    
            const observer = new MutationObserver((mutations, obs) => {
                if (notificationShown) return;
    
                const isSubmitted = mutations.some(mutation => {
                    return Array.from(mutation.addedNodes).some(node => {
                        if (node.nodeType === 1) {
                            const isNewComment = 
                                node.tagName?.toLowerCase() === 'shreddit-comment' ||
                                node.querySelector('shreddit-comment');
                            
                            const isFormCleared = 
                                textArea.value === '' || 
                                textArea.textContent === '';
    
                            return isNewComment || isFormCleared;
                        }
                        return false;
                    });
                });
    
                if (isSubmitted) {
                    console.log('Comment successfully posted');
                    notificationShown = true;
                    utils.showNotification('reddit_comment_posted', 'victory');
                    obs.disconnect();
                }
            });
    
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
    
            // Резервный вариант
            setTimeout(() => {
                if (!notificationShown && (textArea.value === '' || textArea.textContent === '')) {
                    console.log('Comment posted (detected by form clear)');
                    notificationShown = true;
                    utils.showNotification('reddit_comment_posted', 'victory');
                }
            }, 1000);
        }
    }
};

// Инициализация
function initialize() {
    // Добавляем bridge.js
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('bridge.js');
    script.onload = () => script.remove();
    document.documentElement.appendChild(script);

    // Слушаем события из bridge.js
    document.addEventListener('SHOW_SOULS_NOTIFICATION', (e) => {
        const { text, type } = e.detail;
        utils.showNotification(text, type);
    });

    // Определяем и инициализируем нужный обработчик
    const hostname = window.location.hostname;
    if (hostname.includes('youtube.com')) {
        handlers.youtube.initialize();
    } else if (hostname.includes('mail.google.com')) {
        handlers.gmail.initialize();
    } else if (hostname.includes('dtf.ru')) {
        handlers.dtf.initialize();
    } else if (hostname.includes('reddit.com')) {
        handlers.reddit.initialize();
    }
}

// Запускаем инициализацию
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}