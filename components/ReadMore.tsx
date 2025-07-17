import { useState } from 'react';

interface Props {
    text: string;
    maxLength: number;
    className?: string; // Add this line
}

const ReadMore: React.FC<Props> = ({ text, maxLength, className }) => {
    const [showFullText, setShowFullText] = useState(false);

    if (text.length <= maxLength) {
        return <p className={className}>{text}</p>; // Use className here
    }

    return (
        <p className={className}>
            {showFullText ? text : `${text.substring(0, maxLength)}.....`}
            <button onClick={() => setShowFullText(!showFullText)}>
                {showFullText ? ' Voir moins' : 'Voir plus'}
            </button>
        </p>
    );
};

export default ReadMore;