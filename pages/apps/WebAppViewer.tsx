import React from 'react';

interface WebAppViewerProps {
    url: string;
    title: string;
}

const WebAppViewer: React.FC<WebAppViewerProps> = ({ url, title }) => {
    if (!url) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text">
                <p>No URL was provided for this web app.</p>
            </div>
        );
    }
    return (
        <iframe
            src={url}
            className="w-full h-full border-0"
            title={title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
    );
};

export default WebAppViewer;
