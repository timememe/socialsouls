window.showSoulsMessage = function(text, type = 'victory') {
    document.dispatchEvent(new CustomEvent('SHOW_SOULS_NOTIFICATION', { 
        detail: { 
            text: text, // Передаем ключ сообщения
            type: type 
        }
    }));
};