import { toast } from 'react-hot-toast';

export const PROFESSIONAL_ALERT_EVENT = 'codeprep:professional-alert';

let lastServiceAlertAt = 0;

const normalizeText = (value) => String(value || '').toLowerCase();

export const getSafeTokenBalance = (tokens) => {
    const parsed = Number(tokens);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const showInsufficientTokensToast = ({ balance = 0, required = 5 } = {}) => {
    const safeBalance = getSafeTokenBalance(balance);

    if (safeBalance <= 0) {
        toast.error('You are out of tokens. Please upgrade your plan to continue with AI features.');
        return;
    }

    toast.error(`You need ${required} tokens for this action. Current balance: ${safeBalance}.`);
};

export const showProfessionalServicePopup = ({
    title = 'Service Temporarily Busy',
    message = 'We are experiencing high demand right now. Please retry in a moment.'
} = {}) => {
    const now = Date.now();
    if (now - lastServiceAlertAt < 7000) {
        return;
    }
    lastServiceAlertAt = now;

    window.dispatchEvent(new CustomEvent(PROFESSIONAL_ALERT_EVENT, {
        detail: { title, message }
    }));
};

export const isRateLimitLikeIssue = ({ status, message }) => {
    const text = normalizeText(message);
    return (
        status === 429 ||
        text.includes('too many requests') ||
        text.includes('rate limit') ||
        text.includes('quota') ||
        text.includes('limit exceeded')
    );
};

export const isTokenIssueMessage = (message = '') => {
    const text = normalizeText(message);
    return text.includes('insufficient tokens') || text.includes('need') && text.includes('tokens');
};

export const transformProfessionalApiError = (error) => {
    const status = error?.response?.status;
    const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        '';

    if (!isRateLimitLikeIssue({ status, message: backendMessage })) {
        return error;
    }

    const polishedMessage = 'We are handling a high volume of requests. Please try again shortly.';
    showProfessionalServicePopup({
        title: 'Request Queue In Progress',
        message: polishedMessage
    });

    if (error?.response?.data && typeof error.response.data === 'object') {
        error.response.data.message = polishedMessage;
        error.response.data.error = polishedMessage;
    }

    return error;
};
