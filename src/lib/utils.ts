export function translateExpressionToEmoji
(expression: string){
    switch(expression){
        case 'happy':
            return '😁';
        case 'sad':
            return '☹️';
        case 'angry':
            return '😡';
        case 'disgusted':
            return '🤢';
        case 'fearful':
            return '😨';
        case 'neutral':
            return '😐';
        case 'surprised':
            return '😮';
    }
}