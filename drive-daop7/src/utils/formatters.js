export const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
};

export const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const truncateFilename = (filename, maxLength = 20, ellipsis = '...') => {
    if (!filename || typeof filename !== 'string') return '';
    const parts = filename.split('.');
    const extension = parts.length > 1 ? '.' + parts.pop() : '';
    const name = parts.join('.');

    if (name.length <= maxLength) {
        return filename;
    }

    const charsToShow = maxLength - ellipsis.length;
    if (charsToShow < 0) {
        return ellipsis + extension; // Not enough space for even ellipsis
    }

    // Truncate from the end of the name part
    return name.substring(0, charsToShow) + ellipsis + extension;
};