import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import clsx from 'clsx';
import axiosClient from '../utils/axiosClient';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';
import ReactMarkdown from 'react-markdown';

const Whiteboard = ({ roomId, socket }) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const isDrawing = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        canvas.style.width = `${canvas.offsetWidth}px`;
        canvas.style.height = `${canvas.offsetHeight}px`;

        const context = canvas.getContext("2d");
        context.scale(2, 2);
        context.lineCap = "round";
        context.strokeStyle = "#818cf8";
        context.lineWidth = 3;
        contextRef.current = context;

        const handlePeerDraw = (e) => {
            const { x0, y0, x1, y1, color, width } = e.detail;
            const ctx = contextRef.current;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.stroke();
            ctx.closePath();
            // Reset to default
            ctx.strokeStyle = "#818cf8";
            ctx.lineWidth = 3;
        };

        const handlePeerClear = () => {
            contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
        };

        window.addEventListener('peer_draw', handlePeerDraw);
        window.addEventListener('peer_clear_whiteboard', handlePeerClear);

        return () => {
            window.removeEventListener('peer_draw', handlePeerDraw);
            window.removeEventListener('peer_clear_whiteboard', handlePeerClear);
        };
    }, []);

    // Smoother drawing logic
    const lastX = useRef(0);
    const lastY = useRef(0);

    const onMouseDown = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        lastX.current = offsetX;
        lastY.current = offsetY;
        isDrawing.current = true;
    };

    const onMouseMove = (e) => {
        if (!isDrawing.current) return;
        const { offsetX, offsetY } = e.nativeEvent;
        
        const drawData = {
            x0: lastX.current,
            y0: lastY.current,
            x1: offsetX,
            y1: offsetY,
            color: "#818cf8",
            width: 3
        };

        // Draw locally
        const ctx = contextRef.current;
        ctx.beginPath();
        ctx.moveTo(drawData.x0, drawData.y0);
        ctx.lineTo(drawData.x1, drawData.y1);
        ctx.stroke();
        ctx.closePath();

        // Emit to peer
        if (socket) {
            socket.emit('draw_data', { roomId, data: drawData });
        }

        lastX.current = offsetX;
        lastY.current = offsetY;
    };

    const clearBoard = () => {
        const canvas = canvasRef.current;
        contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
        if (socket) socket.emit('clear_whiteboard', { roomId });
    };

    return (
        <div className="w-full h-full relative bg-[#02040a]">
            <canvas
                onMouseDown={onMouseDown}
                onMouseUp={() => isDrawing.current = false}
                onMouseMove={onMouseMove}
                onMouseOut={() => isDrawing.current = false}
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
            />
            <button 
                onClick={clearBoard}
                className="absolute bottom-4 right-4 p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-lg transition-all"
                title="Clear Board"
            >
                <span className="material-symbols-outlined">delete</span>
            </button>
        </div>
    );
};

const MockInterviewPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    // mode can be passed via router state or query param. default 'ai'
    const queryParams = new URLSearchParams(location.search);
    const mode = queryParams.get('mode') || 'ai'; 
    const urlRoomId = queryParams.get('roomId');
    const devPeerRoomId = React.useMemo(() => `mock-${id}-peer-dev`, [id]);
    
    // Check if roomId is in query params
    const roomId = React.useMemo(() => {
        if (mode === 'peer' && import.meta.env.DEV) {
            return devPeerRoomId;
        }
        if (urlRoomId) return urlRoomId;
        // Generate a random ID for shareability
        return `mock-${id}-${mode}-${Math.random().toString(36).substring(2, 8)}`;
    }, [id, mode, urlRoomId, devPeerRoomId]);

    // Update URL if we generated a new shareable room link
    useEffect(() => {
        if (mode === 'peer' && (!urlRoomId || urlRoomId !== roomId)) {
            const newUrl = `${window.location.pathname}?mode=${mode}&roomId=${roomId}`;
            window.history.replaceState(null, '', newUrl);
        }
    }, [mode, urlRoomId, roomId]);

    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('// Write your code here\n');
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);

    const [socket, setSocket] = useState(null);
    const [users, setUsers] = useState([]);
    const [aiResponses, setAiResponses] = useState([]);
    
    // Code Execution State
    const [output, setOutput] = useState('');
    const [runResult, setRunResult] = useState(null);
    const [submitResult, setSubmitResult] = useState(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { user } = useSelector(state => state.auth);

    // AI Speech & CV properties
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const cvTextRef = useRef(location.state?.cvText || null);
    const roleRef = useRef(location.state?.role || 'Software Engineer');
    const [cvFileName, setCvFileName] = useState(location.state?.cvFileName || null);

    // WebRTC properties for Peer mode
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const peerConnection = useRef(null);
    const peerTargetSocketIdRef = useRef(null);
    const pendingIceCandidatesRef = useRef([]);
    const makingOfferRef = useRef(false);
    const localStreamPromiseRef = useRef(null);
    const [hasCameraAccess, setHasCameraAccess] = useState(false);
    const [hasRemoteStream, setHasRemoteStream] = useState(false);
    const [remoteAudioBlocked, setRemoteAudioBlocked] = useState(false);
    const peerJoinAttemptedRef = useRef(false);
    const [peerRoomJoined, setPeerRoomJoined] = useState(mode !== 'peer');
    const [peerJoinError, setPeerJoinError] = useState('');

    // Syncing code safely
    const editorRef = useRef(null);
    const isApplyingRemoteCode = useRef(false);

    // Peer Chat State
    const [peerMessages, setPeerMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef(null);
    const peerChatListRef = useRef(null);

    // Content Switcher Tab
    const [activeTab, setActiveTab] = useState('code'); // 'code' or 'whiteboard'

    // Timer & Status State
    const [timeLeft, setTimeLeft] = useState(null); // in seconds
    const [isInterviewOver, setIsInterviewOver] = useState(false);

    // Report State
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showEndChoiceModal, setShowEndChoiceModal] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [aiInterviewStarted, setAiInterviewStarted] = useState(false);
    const hasEndedRef = useRef(false);
    const rtcIceServers = useMemo(() => {
        const servers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ];

        const rawTurnUrls = import.meta.env.VITE_TURN_URLS || import.meta.env.VITE_TURN_URL || '';
        const turnUrls = String(rawTurnUrls)
            .split(',')
            .map((url) => url.trim())
            .filter(Boolean);

        if (turnUrls.length > 0) {
            const turnServer = { urls: turnUrls };
            if (import.meta.env.VITE_TURN_USERNAME) turnServer.username = import.meta.env.VITE_TURN_USERNAME;
            if (import.meta.env.VITE_TURN_CREDENTIAL) turnServer.credential = import.meta.env.VITE_TURN_CREDENTIAL;
            servers.push(turnServer);
        }

        return servers;
    }, []);
    const handleEndInterviewRef = useRef(null);
    const exampleCases = useMemo(() => (
        Array.isArray(problem?.examples) && problem.examples.length > 0
            ? problem.examples
            : (Array.isArray(problem?.visibleTestCases) ? problem.visibleTestCases : [])
    ), [problem?.examples, problem?.visibleTestCases]);

    const ensureLocalStream = React.useCallback(async () => {
        if (mode !== 'peer') return null;

        if (!window.isSecureContext) {
            setHasCameraAccess(false);
            toast.error("Camera/Mic needs HTTPS on mobile. Open the app using an https URL (not http://LAN-IP).", { id: 'secure-context-camera' });
            return null;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setHasCameraAccess(false);
            toast.error("This browser does not support camera access for WebRTC.");
            return null;
        }

        const refStream = localVideoRef.current?.srcObject;
        if (refStream) {
            setHasCameraAccess(true);
            return refStream;
        }

        if (window.localStream) {
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = window.localStream;
            }
            setHasCameraAccess(true);
            return window.localStream;
        }

        if (localStreamPromiseRef.current) {
            return localStreamPromiseRef.current;
        }

        localStreamPromiseRef.current = navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                window.localStream = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                setHasCameraAccess(true);
                return stream;
            })
            .catch((err) => {
                console.error("Camera access denied:", err);
                setHasCameraAccess(false);
                if (err?.name === 'NotReadableError') {
                    toast.error("Camera is busy or blocked in another tab/window. Close other camera uses and retry.");
                } else {
                    toast.error("Camera/Microphone access denied. You can still join, but your video may be off.");
                }
                return null;
            })
            .finally(() => {
                localStreamPromiseRef.current = null;
            });

        return localStreamPromiseRef.current;
    }, [mode]);

    const attachLocalTracksToPeer = React.useCallback((pc, stream) => {
        if (!pc || !stream) return;
        stream.getTracks().forEach((track) => {
            const exists = pc.getSenders().some((sender) => sender.track && sender.track.id === track.id);
            if (!exists) {
                pc.addTrack(track, stream);
            }
        });
    }, []);

    // ── Fetch problem ─────────────────────────────────────────────
    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const response = await axiosClient.get(`problem/problemById/${id}`);
                const problemData = response.data.problem;
                setProblem(problemData);
                if (problemData.startCode && problemData.startCode.length > 0) {
                    const starter = problemData.startCode.find(sc => sc.language.toLowerCase() === language)
                        || problemData.startCode[0];
                    if (starter) {
                        setCode(starter.initialCode);
                        setLanguage(starter.language.toLowerCase());
                    }
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching problem:', error);
                toast.error('Failed to load problem details');
                setLoading(false);
            }
        };
        if (id) fetchProblem();
    }, [id]);

    // ── Timer Logic ────────────────────────────────────────────────
    useEffect(() => {
        const initialDuration = location.state?.duration || 30; // default 30 mins
        setTimeLeft(initialDuration * 60);
        setIsInterviewOver(false);
        hasEndedRef.current = false;
    }, [location.state?.duration]);

    const timerReady = timeLeft !== null;

    useEffect(() => {
        if (!timerReady || isInterviewOver) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null) return prev;

                if (prev <= 1) {
                    clearInterval(timer);
                    if (!hasEndedRef.current) {
                        hasEndedRef.current = true;
                        setIsInterviewOver(true);
                        toast.error('Time is up! The interview is concluding.');
                        handleEndInterviewRef.current?.();
                    }
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timerReady, isInterviewOver]);

    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const extractCvInsights = () => {
        const text = String(cvTextRef.current || '').toLowerCase();
        const keywords = [
            'javascript', 'typescript', 'react', 'node', 'express', 'mongodb', 'sql', 'java', 'python',
            'c++', 'docker', 'aws', 'system design', 'redis', 'rest api', 'tailwind', 'next.js'
        ];
        const foundSkills = keywords.filter((skill) => text.includes(skill)).slice(0, 8);

        const rawLines = String(cvTextRef.current || '')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);

        let experienceSnippet = rawLines.find((line) => /experience|years|worked|engineer|developer/i.test(line)) || '';
        if (!experienceSnippet) {
            experienceSnippet = rawLines.slice(0, 2).join(' ').slice(0, 160);
        }

        return {
            skills: foundSkills,
            experience: experienceSnippet || 'Experience details will appear after CV analysis.'
        };
    };

    const cvInsights = useMemo(() => extractCvInsights(), [cvFileName]);

    // ── WebRTC Setup for Peer Mode ────────────────────────────────
    useEffect(() => {
        if (mode !== 'peer') return;

        let isMounted = true;
        if (isMounted) {
            ensureLocalStream();
        }

        return () => {
            isMounted = false;
            // Clean up the ref's srcObject
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                const tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                localVideoRef.current.srcObject = null;
            }
            // Clean up the global stream to actually release the camera access
            if (window.localStream) {
                const globalTracks = window.localStream.getTracks();
                globalTracks.forEach(track => track.stop());
                window.localStream = null;
            }
            localStreamPromiseRef.current = null;
        };
    }, [mode, ensureLocalStream]);

    const createPeerConnection = (newSocket, targetSocketId) => {
        peerTargetSocketIdRef.current = targetSocketId;

        if (peerConnection.current && peerConnection.current.signalingState !== 'closed') {
            return peerConnection.current;
        }

        const pc = new RTCPeerConnection({
            iceServers: rtcIceServers,
            iceCandidatePoolSize: 10
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                newSocket.emit('webrtc_ice_candidate', { roomId, candidate: event.candidate, target: peerTargetSocketIdRef.current });
            }
        };

        pc.oniceconnectionstatechange = async () => {
            if (pc.iceConnectionState !== 'failed') return;
            if (!newSocket?.connected || !peerTargetSocketIdRef.current) return;
            if (pc.signalingState !== 'stable') return;

            try {
                if (typeof pc.restartIce === 'function') {
                    pc.restartIce();
                }
                const restartOffer = await pc.createOffer({ iceRestart: true });
                await pc.setLocalDescription(restartOffer);
                newSocket.emit('webrtc_offer', { roomId, offer: restartOffer, target: peerTargetSocketIdRef.current });
            } catch (err) {
                console.error('ICE restart failed', err);
            }
        };

        pc.ontrack = (event) => {
            if (!remoteVideoRef.current) return;

            // Some browsers emit empty event.streams; build a MediaStream from tracks in that case.
            if (!remoteStreamRef.current) {
                remoteStreamRef.current = new MediaStream();
            }

            if (event.streams && event.streams[0]) {
                remoteStreamRef.current = event.streams[0];
            } else if (event.track) {
                const alreadyAdded = remoteStreamRef.current.getTracks().some((t) => t.id === event.track.id);
                if (!alreadyAdded) {
                    remoteStreamRef.current.addTrack(event.track);
                }
            }

            remoteVideoRef.current.srcObject = remoteStreamRef.current;
            setHasRemoteStream(true);

            const playPromise = remoteVideoRef.current.play?.();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise
                    .then(() => setRemoteAudioBlocked(false))
                    .catch(() => {
                        setRemoteAudioBlocked(true);
                    });
            }
        };

        if (localVideoRef.current && localVideoRef.current.srcObject) {
            attachLocalTracksToPeer(pc, localVideoRef.current.srcObject);
        } else if (window.localStream) {
            // Fallback if ref isn't attached but stream exists
            attachLocalTracksToPeer(pc, window.localStream);
        }

        peerConnection.current = pc;
        return pc;
    };

    const flushPendingIceCandidates = useCallback(async () => {
        const pc = peerConnection.current;
        if (!pc || !pc.remoteDescription) return;

        const queued = pendingIceCandidatesRef.current;
        pendingIceCandidatesRef.current = [];

        for (const candidate of queued) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error('Failed to apply queued ICE candidate', err);
            }
        }
    }, []);

    const initiateWebRTC = async (newSocket, targetSocketId) => {
        if (mode === 'peer' && !peerRoomJoined) return;
        if (peerConnection.current && (peerConnection.current.connectionState === 'connected' || peerConnection.current.connectionState === 'connecting')) {
            return;
        }
        await ensureLocalStream();
        const pc = createPeerConnection(newSocket, targetSocketId);
        try {
            makingOfferRef.current = true;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            newSocket.emit('webrtc_offer', { roomId, offer, target: targetSocketId });
        } finally {
            makingOfferRef.current = false;
        }
    };

    const handleReceiveOffer = async (newSocket, offer, fromSocketId) => {
        await ensureLocalStream();
        const pc = createPeerConnection(newSocket, fromSocketId);

        // Collision-safe negotiation: one peer politely accepts rollback on glare.
        const polite = String(newSocket.id) > String(fromSocketId);
        const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable';

        if (offerCollision && !polite) {
            return;
        }

        if (offerCollision) {
            await Promise.all([
                pc.setLocalDescription({ type: 'rollback' }),
                pc.setRemoteDescription(new RTCSessionDescription(offer))
            ]);
        } else {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        newSocket.emit('webrtc_answer', { roomId, answer, target: fromSocketId });
        await flushPendingIceCandidates();
    };

    // ── Socket initialization ─────────────────────────────────────
    const joinInterviewRoom = (activeSocket) => {
        if (!activeSocket) return;

        activeSocket.emit(
            'join_interview',
            {
                roomId,
                mode,
                cvText: cvTextRef.current,
                role: roleRef.current,
                cvFileName
            },
            (response) => {
                if (!response?.success) {
                    setPeerRoomJoined(false);
                    setPeerJoinError(response?.message || 'Unable to join interview room.');
                    if (response?.message) {
                        toast.error(response.message);
                    }
                    if (response?.isClosed) {
                        setTimeout(() => navigate('/'), 2000);
                    }
                    return;
                }

                if (response.code !== undefined) {
                    isApplyingRemoteCode.current = true;
                    setCode(response.code || '');
                    setLanguage(response.language || 'javascript');
                }

                const roomUsers = Array.isArray(response.users) ? response.users : [];
                setUsers(roomUsers);
                setPeerJoinError('');
                setPeerRoomJoined(true);

                if (mode === 'peer') {
                    const peers = roomUsers.filter((u) => !u?.isAI && u?.socketId && u.socketId !== activeSocket.id);
                    if (peers.length > 0) {
                        setTimeout(() => {
                            const targetPeer = peers[0];
                            const shouldInitiate = String(activeSocket.id) < String(targetPeer.socketId);
                            if (shouldInitiate && !peerConnection.current && activeSocket.connected && !hasRemoteStream) {
                                initiateWebRTC(activeSocket, targetPeer.socketId);
                            }
                        }, 1500);
                    }
                }

                if (mode === 'ai' && aiResponses.length === 0) {
                    setAiResponses([
                        "Interviewer: Type or say 'ready for interview' when you are ready to begin."
                    ]);
                }
            }
        );
    };

    useEffect(() => {
        const resolveBackendUrl = () => {
            const envUrl = import.meta.env.VITE_API_URL;
            const fallbackUrl = `http://${window.location.hostname}:5000`;

            if (!envUrl) return fallbackUrl;

            try {
                const parsed = new URL(envUrl);
                const isEnvLoopback = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
                const isPageLoopback = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

                if (isEnvLoopback && !isPageLoopback) {
                    parsed.hostname = window.location.hostname;
                }

                return parsed.origin;
            } catch {
                return fallbackUrl;
            }
        };

        const backendUrl = resolveBackendUrl();
        const persistedToken = (() => {
            try {
                return localStorage.getItem('codeprep_auth_token');
            } catch {
                return null;
            }
        })();
        const socketAuthToken = user?.token || persistedToken || undefined;

        const newSocket = io(`${backendUrl}/mock-interview`, {
             withCredentials: true,
             transports: ['polling', 'websocket'],
             tryAllTransports: true,
             timeout: 20000,
             auth: socketAuthToken ? { token: socketAuthToken } : undefined,
        });

        newSocket.on('connect', () => {
            // Always join room on connect. Media readiness is handled in WebRTC setup.
            if (mode === 'peer') {
                peerJoinAttemptedRef.current = true;
            }
            joinInterviewRoom(newSocket);
        });

        newSocket.on('connect_error', (err) => {
            console.error('❌ Socket Connection error:', {
                message: err.message,
                description: err.description,
                context: err.context,
                type: err.type,
                backendUrl,
            });
            toast.error(`Socket Connection Error (${backendUrl}): ${err.message}`);
        });
        
        newSocket.on('disconnect', (reason) => {
            console.warn('⚠️ Socket Disconnected:', { reason, backendUrl, socketId: newSocket.id });
            if (mode === 'peer') {
                setPeerRoomJoined(false);
            }
        });

        newSocket.on('user_joined', (newUser) => {
             toast.success(`${newUser.firstName || 'User'} joined the interview`);
             setUsers(prev => {
                 const filtered = prev.filter((u) => u.socketId !== newUser.socketId);
                 return [...filtered, newUser];
             });
             
             if (mode === 'peer' && newUser?.socketId) {
                 const shouldInitiate = String(newSocket.id) < String(newUser.socketId);
                 if (!shouldInitiate || peerConnection.current) {
                     return;
                 }
                 initiateWebRTC(newSocket, newUser.socketId);
             }
        });

        newSocket.on('user_left', ({ socketId }) => {
             setUsers(prev => {
                 return prev.filter(u => u.socketId !== socketId);
             });
             if (mode === 'peer' && peerConnection.current) {
                 peerConnection.current.close();
                 peerConnection.current = null;
                 if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                 if (remoteStreamRef.current) {
                    remoteStreamRef.current.getTracks().forEach((t) => t.stop());
                    remoteStreamRef.current = null;
                 }
                 setHasRemoteStream(false);
                 setRemoteAudioBlocked(false);
                 toast.success("Peer has left the call.");
             }
        });

        newSocket.on('webrtc_offer', async ({ offer, from }) => {
             if (mode !== 'peer') return;
             await handleReceiveOffer(newSocket, offer, from);
        });

        newSocket.on('webrtc_answer', async ({ answer }) => {
             if (mode !== 'peer') return;
             if (peerConnection.current) {
                 await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
                 await flushPendingIceCandidates();
             }
        });

        newSocket.on('webrtc_ice_candidate', async ({ candidate }) => {
             if (mode !== 'peer') return;
             if (peerConnection.current) {
                 try {
                     if (!peerConnection.current.remoteDescription) {
                         pendingIceCandidatesRef.current.push(candidate);
                         return;
                     }
                     await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                 } catch (e) {
                     console.error('Error adding received ice candidate', e);
                 }
             } else {
                 // peerConnection might not be instantiated yet (e.g. waiting for camera permission)
                 pendingIceCandidatesRef.current.push(candidate);
             }
        });

        newSocket.on('code_update', ({ code: newCode }) => {
               isApplyingRemoteCode.current = true;
             setCode(newCode);
        });

        newSocket.on('language_update', ({ language: newLang }) => {
             setLanguage(newLang);
        });

        newSocket.on('ai_response', ({ text }) => {
             setAiResponses(prev => [...prev, text]);
             speakAI(text);
        });

        newSocket.on('ai_error', ({ message }) => {
             toast.error(message);
         });

        newSocket.on('peer_chat_message', (payload) => {
             setPeerMessages(prev => [...prev, payload]);
        });

        newSocket.on('draw_data', ({ data }) => {
             // Will be handled by whiteboard ref/state
             window.dispatchEvent(new CustomEvent('peer_draw', { detail: data }));
        });

        newSocket.on('clear_whiteboard', () => {
             window.dispatchEvent(new CustomEvent('peer_clear_whiteboard'));
        });

        newSocket.on('room_invalidated', ({ message }) => {
             toast.error(message || "This room is no longer valid.");
             navigate('/');
        });

        setSocket(newSocket);
        
        return () => {
             pendingIceCandidatesRef.current = [];
             newSocket.disconnect();
        };
    }, [roomId, mode, user?.token, flushPendingIceCandidates]);

    // Join peer rooms once socket is connected (camera may be unavailable and should not block joining).
    useEffect(() => {
        if (mode === 'peer' && socket && socket.connected && !peerJoinAttemptedRef.current) {
            peerJoinAttemptedRef.current = true;
            joinInterviewRoom(socket);
        }
    }, [mode, socket, roomId, cvFileName]);

    useEffect(() => {
        peerJoinAttemptedRef.current = false;
    }, [roomId, mode]);

    useEffect(() => {
        if (mode !== 'peer') {
            setPeerRoomJoined(true);
            setPeerJoinError('');
            return;
        }
        setPeerRoomJoined(false);
    }, [mode, roomId]);

    // ── Code Handlers ──────────────────────────────────────────────
    const handleEditorChange = (value) => {
         const nextCode = value ?? '';
         setCode(nextCode);

         if (isApplyingRemoteCode.current) {
             isApplyingRemoteCode.current = false;
             return;
         }

         if (socket) {
             socket.emit('code_change', { roomId, code: nextCode });
         }
    };

    const handleLanguageChange = (e) => {
         const newLang = e.target.value;
         setLanguage(newLang);
         if (socket) {
             socket.emit('language_change', { roomId, language: newLang });
         }
    };

    const handleSendPeerMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !socket) return;
        if (!peerRoomJoined) {
            toast.error('Not joined to peer room yet. Please wait or rejoin.');
            return;
        }
        
        const payload = {
            sender: user.firstName,
            message: chatInput,
            timestamp: new Date().toISOString()
        };
        
        socket.emit('peer_chat_message', { roomId, message: chatInput });
        setPeerMessages(prev => [...prev, payload]);
        setChatInput('');
    };

    useEffect(() => {
        if (mode === 'peer' && peerChatListRef.current) {
            peerChatListRef.current.scrollTop = peerChatListRef.current.scrollHeight;
            return;
        }
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [peerMessages, mode]);

    const processAiInput = (rawText, options = {}) => {
        const text = String(rawText || '').trim();
        const { clearInput = false } = options;
        if (!text) return;

        setAiResponses(prev => [...prev, `You: ${text}`]);
        if (clearInput) {
            setChatInput('');
        }

        if (!aiInterviewStarted) {
            const normalized = text.toLowerCase();
            const isReady = normalized.includes('ready for interview') || normalized === 'ready' || normalized.includes('i am ready');

            if (!isReady) {
                setAiResponses(prev => [...prev, "Interviewer: Please say or type 'ready for interview' to start."]);
                return;
            }

            setAiInterviewStarted(true);
            const introText = "Interviewer: Great, welcome to your AI interview. Please introduce yourself in 3 to 5 lines. After that, I will ask role-based questions from your CV and responses.";
            setAiResponses(prev => [...prev, introText]);
            speakAI(introText.replace('Interviewer: ', ''));
            return;
        }

        if (socket && socket.connected) {
            socket.emit('ai_voice_message', { roomId, text }, (res) => {
                if (res?.error) toast.error(res.error);
            });
        } else {
            toast.error("Socket not connected, cannot send message to AI.");
        }
    };

    const handleSendAiMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        processAiInput(chatInput, { clearInput: true });
    };

    const handleEnableRemoteAudio = () => {
        if (!remoteVideoRef.current) return;
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.play?.()
            .then(() => setRemoteAudioBlocked(false))
            .catch(() => setRemoteAudioBlocked(true));
    };

    const handleRetryCamera = async () => {
        const stream = await ensureLocalStream();
        if (!stream) return;
        if (peerConnection.current) {
            attachLocalTracksToPeer(peerConnection.current, stream);
            if (socket && peerTargetSocketIdRef.current && peerConnection.current.signalingState === 'stable') {
                try {
                    const offer = await peerConnection.current.createOffer();
                    await peerConnection.current.setLocalDescription(offer);
                    socket.emit('webrtc_offer', { roomId, offer, target: peerTargetSocketIdRef.current });
                } catch (err) {
                    console.error('Failed to renegotiate after camera retry', err);
                }
            }
        }
    };

    const handleRun = async () => {
        setIsExecuting(true);
        setOutput('Running...');
        setRunResult(null);
        setSubmitResult(null);
        try {
            const response = await axiosClient.post(`/submission/run/${problem._id}`, {
                code,
                language,
                interviewMode: true
            });
            if (response.data.testResult && Array.isArray(response.data.testResult)) {
                setRunResult(response.data.testResult);
                setOutput('');
            } else {
                setOutput(JSON.stringify(response.data, null, 2));
            }
        } catch (error) {
            setOutput(error.response?.data?.message || 'Error running code');
        } finally {
            setIsExecuting(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setOutput('Submitting...');
        setSubmitResult(null);
        try {
            const response = await axiosClient.post(`/submission/submit/${problem._id}`, {
                code,
                language,
                interviewMode: true
            });
            setSubmitResult(response.data);
            const passed = Number(response.data?.submission?.testCasesPassed ?? 0);
            const total = Number(response.data?.submission?.testCasesTotal ?? 0);
            const status = response.data?.submission?.status || 'Submitted';
            if (total > 0) {
                setOutput(`Submission: ${status}. Passed ${passed}/${total} test cases.`);
            } else {
                setOutput(response.data?.message || `Submission: ${status}.`);
            }
            toast.success('Submission completed');
        } catch (error) {
            const message = error.response?.data?.message || 'Error submitting code';
            setSubmitResult({ error: message });
            setOutput(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── AI Speech Integration ──────────────────────────────────────
    const speakAI = (text) => {
         if ('speechSynthesis' in window) {
              if (window.speechSynthesis.speaking) {
                  window.speechSynthesis.cancel();
              }
              
              const msg = new SpeechSynthesisUtterance(text);
              const voices = window.speechSynthesis.getVoices();
              const englishVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Google')) || 
                                   voices.find(v => v.lang.includes('en')) || 
                                   voices[0];
                                   
              if (englishVoice) {
                  msg.voice = englishVoice;
              }
              msg.rate = 1.0;
              msg.pitch = 1.0;
              
              // Prevent garbage collection bugs for longer speeches in Chrome/Windows
              if (!window.utterances) window.utterances = [];
              window.utterances.push(msg);
              msg.onstart = () => setIsAiSpeaking(true);
              msg.onend = () => {
                  setIsAiSpeaking(false);
                  window.utterances = window.utterances.filter(u => u !== msg);
              };
              msg.onerror = () => {
                  setIsAiSpeaking(false);
              };
              
              window.speechSynthesis.speak(msg);
         }
    };

    const toggleMicrophone = () => {
         if (isListening) {
             recognitionRef.current?.stop();
             setIsListening(false);
         } else {
             if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                 const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                 const recognition = new SpeechRecognition();
                 recognition.continuous = false;
                 recognition.interimResults = false;
                 
                 recognition.onstart = () => setIsListening(true);
                 recognition.onresult = (event) => {
                     const transcript = event.results[0][0].transcript;
                     processAiInput(transcript);
                 };
                 recognition.onerror = () => setIsListening(false);
                 recognition.onend = () => setIsListening(false);
                 
                 recognitionRef.current = recognition;
                 recognition.start();
             } else {
                 toast.error("Speech Recognition API is not supported in your browser.");
             }
         }
    };

    // ── Interview Ending & Feedback ───────────────────────────────
    const handleEndInterview = useCallback(async () => {
        if (mode === 'ai') {
            if (aiResponses.length < 2) {
                toast.error("You need to interact with the interviewer before getting a report.");
                return;
            }

            setIsGeneratingReport(true);
            const toastId = toast.loading('Generating comprehensive feedback report...');

            try {
                const response = await axiosClient.post('/interview/generate-report', {
                    chatHistory: aiResponses,
                    problemContext: problem?.title,
                    cvContext: !!cvFileName
                });

                if (response.data.success) {
                    setReportData(response.data.report);
                    setShowReportModal(true);
                    toast.success('Report generated successfully!', { id: toastId });
                    if (socket) socket.disconnect();
                } else {
                    throw new Error("Failed to generate report from server.");
                }
            } catch (error) {
                console.error("Report Generation Error:", error);
                toast.error(error.response?.data?.message || 'Failed to generate report.', { id: toastId });
            } finally {
                setIsGeneratingReport(false);
            }
        } else {
            // Peer mode: Just inform and redirect or show simple summary
            toast.success("Interview session ended. Returning to dashboard.");
            if (socket) socket.disconnect();
            setTimeout(() => navigate('/'), 2000);
        }
    }, [mode, aiResponses, problem?.title, cvFileName, socket, navigate]);

    useEffect(() => {
        handleEndInterviewRef.current = handleEndInterview;
    }, [handleEndInterview]);

    const handleSidebarEndClick = useCallback(() => {
        if (mode === 'ai') {
            setShowEndChoiceModal(true);
            return;
        }
        handleEndInterview();
    }, [mode, handleEndInterview]);

    const handleExitToDashboard = useCallback(() => {
        setShowEndChoiceModal(false);
        if (socket) socket.disconnect();
        navigate('/');
    }, [socket, navigate]);

    const handleGenerateReportChoice = useCallback(() => {
        setShowEndChoiceModal(false);
        handleEndInterview();
    }, [handleEndInterview]);

    if (loading || !problem) {
        return <div className="flex h-[calc(100vh-61px)] items-center justify-center text-slate-300">Loading...</div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-61px)] text-slate-200 overflow-hidden relative">
            <style>{`
                .mock-room-theme {
                    background:
                        radial-gradient(120% 120% at 0% 0%, rgba(14, 165, 233, 0.16) 0%, rgba(14, 165, 233, 0) 48%),
                        radial-gradient(120% 120% at 100% 100%, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 50%),
                        #02040a;
                }
                .mock-room-orb-1 {
                    position: absolute;
                    left: -220px;
                    top: -220px;
                    width: 760px;
                    height: 760px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(14, 165, 233, 0.65) 0%, rgba(14, 165, 233, 0) 70%);
                    filter: blur(120px);
                    opacity: 0.24;
                    z-index: 0;
                    pointer-events: none;
                }
                .mock-room-orb-2 {
                    position: absolute;
                    right: -150px;
                    bottom: -150px;
                    width: 620px;
                    height: 620px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.62) 0%, rgba(99, 102, 241, 0) 70%);
                    filter: blur(120px);
                    opacity: 0.24;
                    z-index: 0;
                    pointer-events: none;
                }
                .room-panel {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                @keyframes siriPulse {
                    0% { transform: scale(1); filter: saturate(1); }
                    50% { transform: scale(1.05); filter: saturate(1.25); }
                    100% { transform: scale(1); filter: saturate(1); }
                }
                @keyframes siriRingOne {
                    0% { transform: scale(1); opacity: 0.65; }
                    100% { transform: scale(1.18); opacity: 0; }
                }
                @keyframes siriRingTwo {
                    0% { transform: scale(1); opacity: 0.5; }
                    100% { transform: scale(1.28); opacity: 0; }
                }
                .siri-orb-idle {
                    transition: transform 0.3s ease;
                }
                .siri-orb-active {
                    animation: siriPulse 1.1s ease-in-out infinite;
                }
                .siri-ring-1 {
                    animation: siriRingOne 1.2s ease-out infinite;
                }
                .siri-ring-2 {
                    animation: siriRingTwo 1.4s ease-out infinite;
                }
            `}</style>
            <div className="mock-room-theme absolute inset-0" />
            <div className="mock-room-orb-1" />
            <div className="mock-room-orb-2" />
            
            {mode !== 'ai' && (
            <header className="flex justify-between items-center px-6 py-3 bg-black/40 border-b border-white/10 backdrop-blur-md relative z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-white drop-shadow-sm">{problem.title} <span className="text-sm text-slate-400 font-normal">| Mock Interview</span></h1>
                    <span className="px-2 font-bold py-1 bg-indigo-500/20 border border-indigo-500/35 text-indigo-200 rounded-lg text-xs shadow-[0_0_10px_rgba(99,102,241,0.25)]">
                        {mode === 'ai' ? 'AI Interviewer' : 'Peer-to-Peer Interview'}
                    </span>
                    {mode === 'peer' && (
                        <>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success("Invite link copied to clipboard!");
                                }}
                                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm ml-2 backdrop-blur-sm"
                            >
                                <span className="material-symbols-outlined text-[16px]">link</span>
                                Copy Invite Link
                            </button>
                            <span className="text-[10px] text-slate-400 font-mono bg-white/5 border border-white/10 px-2 py-1 rounded-md">
                                Room: {roomId}
                            </span>
                        </>
                    )}
                    
                    {/* Timer Display */}
                    {mode !== 'ai' && (
                        <div className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md ml-4 font-mono text-sm font-bold",
                            timeLeft < 60 ? "bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse" : "bg-black/40 border-white/10 text-sky-300"
                        )}>
                            <span className="material-symbols-outlined text-[18px]">timer</span>
                            <span>{timeLeft !== null ? formatTime(timeLeft) : "--:--"}</span>
                        </div>
                    )}
                </div>
                
                {/* Header Action Buttons */}
                {mode !== 'ai' && (
                    <div className="flex items-center gap-3">
                        <Link 
                            to="/" 
                            className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm backdrop-blur-sm"
                        >
                            Leave Room
                        </Link>
                    </div>
                )}
            </header>
            )}

            {mode === 'peer' && !peerRoomJoined && (
                <div className="relative z-10 mx-4 mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    <span className="font-semibold">Peer room not fully joined.</span> Chat/video sync will start after successful join.
                    {peerJoinError && <span className="ml-2 text-rose-300">{peerJoinError}</span>}
                </div>
            )}

            <main className="flex-1 flex overflow-hidden p-0 gap-2 bg-transparent relative z-10 min-h-0">
                {mode === 'ai' ? (
                    <div className="h-full w-full grid grid-cols-12 gap-0 border-t border-white/5">
                        <aside className="col-span-3 border-r border-white/10 bg-black/35 backdrop-blur-xl p-4 overflow-y-auto">
                            <div className="text-xs uppercase tracking-[0.2em] text-indigo-300 font-bold mb-3">Interview Mode</div>
                            <div className="room-panel rounded-2xl p-4 mb-4 bg-white/5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-11 h-11 rounded-full bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-white font-bold">
                                        {(user?.firstName || 'U').slice(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-white font-semibold text-sm">{user?.firstName || 'Candidate'} {user?.lastName || ''}</div>
                                        <div className="text-slate-400 text-xs">{roleRef.current || 'Software Engineer'}</div>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400 mb-2">Core Skills</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {cvInsights.skills.length > 0 ? cvInsights.skills.map((skill) => (
                                            <span key={skill} className="px-2 py-1 rounded-md text-[10px] border border-white/15 bg-white/5 text-slate-200">
                                                {skill}
                                            </span>
                                        )) : (
                                            <span className="text-xs text-slate-500">Upload CV to detect skills.</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400 mb-1">Experience</div>
                                    <p className="text-xs text-slate-300 leading-relaxed">{cvInsights.experience}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className={clsx(
                                    "flex items-center justify-between px-3 py-2.5 rounded-lg border font-mono text-sm",
                                    timeLeft < 60 ? "bg-rose-500/20 border-rose-400/40 text-rose-300 animate-pulse" : "bg-indigo-500/10 border-indigo-400/30 text-indigo-200"
                                )}>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[16px]">timer</span>
                                        Time Left
                                    </span>
                                    <span className="font-bold">{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
                                </div>
                                <button
                                    onClick={handleSidebarEndClick}
                                    disabled={isGeneratingReport}
                                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm border bg-rose-500/15 border-rose-400/35 text-rose-300 hover:bg-rose-500/25 disabled:opacity-60"
                                >
                                    {isGeneratingReport ? 'Generating Feedback...' : 'End Interview'}
                                </button>
                                <Link
                                    to="/"
                                    className="block w-full text-left px-3 py-2.5 rounded-lg text-sm border bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                                >
                                    Leave Room
                                </Link>
                            </div>
                        </aside>

                        <section className="col-span-5 border-r border-white/10 bg-[#040812] relative flex flex-col items-center justify-center">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.25),rgba(2,6,23,0.05)_45%,rgba(2,6,23,0.95)_70%)]"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className={`relative w-52 h-52 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-600 border border-indigo-200/30 shadow-[0_0_80px_rgba(129,140,248,0.55)] flex items-center justify-center ${isListening || isAiSpeaking ? 'siri-orb-active' : 'siri-orb-idle'}`}>
                                    <span className="material-symbols-outlined text-6xl text-white/90">graphic_eq</span>
                                    <span className={`absolute inset-0 rounded-full border border-indigo-300/40 ${isListening || isAiSpeaking ? 'siri-ring-1' : 'opacity-0'}`}></span>
                                    <span className={`absolute -inset-3 rounded-full border border-cyan-300/30 ${isListening || isAiSpeaking ? 'siri-ring-2' : 'opacity-0'}`}></span>
                                </div>
                                <p className="mt-6 tracking-[0.28em] text-indigo-200 text-xl">{isAiSpeaking ? 'SPEAKING' : isListening ? 'LISTENING' : 'READY'}</p>
                                <p className="text-slate-400 text-sm mt-2">{isAiSpeaking ? 'AI is asking the next question' : 'Speak your answer clearly'}</p>
                            </div>

                            <div className="absolute bottom-4 left-4 right-4 room-panel rounded-full p-2 bg-black/70 border border-white/10 flex items-center gap-2 z-10">
                                <button
                                    onClick={toggleMicrophone}
                                    className={clsx('w-10 h-10 rounded-full flex items-center justify-center border transition-all', isListening ? 'bg-rose-500/30 border-rose-400/40 text-rose-300' : 'bg-indigo-500/25 border-indigo-400/40 text-indigo-200')}
                                    title={isListening ? 'Stop Listening' : 'Start Listening'}
                                >
                                    <span className="material-symbols-outlined text-[20px]">mic</span>
                                </button>
                                <form onSubmit={handleSendAiMessage} className="flex-1 flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Type your response..."
                                        className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-400/40"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!chatInput.trim()}
                                        className="w-9 h-9 rounded-full bg-indigo-500/25 border border-indigo-400/40 text-indigo-200 flex items-center justify-center disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">send</span>
                                    </button>
                                </form>
                            </div>
                        </section>

                        <section className="col-span-4 bg-black/30 backdrop-blur-xl p-4 flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs uppercase tracking-[0.18em] text-white font-bold">Live Transcript</h3>
                                <div className="w-2 h-2 rounded-full bg-indigo-300 shadow-[0_0_8px_rgba(165,180,252,0.9)]"></div>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                {aiResponses.map((msg, i) => {
                                    const isUser = msg.startsWith('You:');
                                    const cleanText = msg.replace('You: ', '').replace('Interviewer: ', '');
                                    return (
                                        <div key={`${msg}-${i}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[88%] rounded-2xl px-3 py-2 border text-sm leading-relaxed ${isUser ? 'bg-indigo-500/15 border-indigo-400/30 text-indigo-100' : 'bg-white/5 border-white/10 text-slate-200'}`}>
                                                {cleanText}
                                            </div>
                                        </div>
                                    );
                                })}
                                {aiResponses.length === 0 && (
                                    <div className="text-sm text-slate-500">Transcript will appear once interview starts.</div>
                                )}
                            </div>
                        </section>
                    </div>
                ) : (
                <Group orientation="horizontal" className="h-full w-full min-h-0">
                    
                    {/* LEFT PANEL: Problem Description */}
                    <Panel defaultSize={30} minSize={20} className={clsx("flex h-full min-h-0 flex-col room-panel rounded-xl shadow-2xl overflow-hidden bg-black/20", mode === 'ai' && 'hidden')}>
                        <div className="bg-white/5 border-b border-white/10 px-4 py-3 font-bold text-white flex items-center gap-2 text-sm shrink-0 backdrop-blur-md">
                             <span className="material-symbols-outlined text-blue-400 text-[18px] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">description</span> 
                             <span className="drop-shadow-sm">Problem Description</span>
                        </div>
                        <div className="flex-1 p-5 overflow-y-auto text-sm text-slate-300 space-y-5 custom-scrollbar bg-transparent">
                             <h2 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">{problem.title}</h2>
                             <div className="flex gap-2 mb-4">
                                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${problem.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : problem.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'}`}>
                                      {problem.difficulty ? problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1) : 'Unknown'}
                                  </span>
                             </div>
                             
                             <div 
                                className="prose prose-sm prose-invert max-w-none break-words leading-relaxed text-slate-300
                                           prose-headings:text-slate-100 prose-a:text-blue-400 prose-strong:text-slate-200 
                                           prose-code:text-indigo-300 prose-code:bg-black/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-white/10
                                           prose-pre:bg-black/60 prose-pre:text-slate-300 prose-pre:border prose-pre:border-white/10 prose-p:text-slate-300
                                           [&_*]:!text-slate-300" 
                                dangerouslySetInnerHTML={{ __html: problem.description }} 
                             />
                             
                             {exampleCases.length > 0 && (
                                 <div className="mt-8 space-y-4">
                                     <h3 className="font-bold text-base text-white border-b border-white/10 pb-2 drop-shadow-sm">Examples / Test Cases</h3>
                                     {exampleCases.map((ex, i) => (
                                         <div key={i} className="bg-black/30 border border-white/10 rounded-lg p-4 text-sm shadow-inner backdrop-blur-sm">
                                              <p className="font-bold text-slate-200 mt-1 mb-2 capitalize tracking-wide drop-shadow-sm">Example {i + 1}:</p>
                                              <div className="bg-black/40 p-3 text-slate-300 rounded border border-white/5 font-mono text-xs shadow-inner leading-relaxed">
                                                  <strong className="text-slate-400 uppercase tracking-wide text-[10px]">Input:</strong> {ex.input}<br/>
                                                  <strong className="text-slate-400 uppercase tracking-wide text-[10px] mt-1 inline-block">Output:</strong> {ex.output}<br/>
                                                  {ex.explanation && <><strong className="text-slate-400 uppercase tracking-wide text-[10px] mt-1 inline-block">Explanation:</strong> <span className="text-slate-300/80">{ex.explanation}</span></>}
                                              </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                    </Panel>

                    <Separator className={clsx("w-2 cursor-col-resize flex flex-col justify-center items-center group touch-none", mode === 'ai' && 'hidden')}>
                        <div className="h-6 w-1 bg-white/20 rounded-full" />
                    </Separator>

                    {/* MIDDLE PANEL: Code Editor & Terminal */}
                    <Panel defaultSize={mode === 'ai' ? 50 : 45} minSize={30} className={clsx("flex h-full min-h-0 flex-col bg-transparent overflow-hidden", mode === 'ai' && 'order-3')}>
                        <Group orientation="vertical" className="h-full min-h-0">
                            {/* Top: Editor */}
                            <Panel defaultSize={70} minSize={25} className="flex min-h-0 flex-col room-panel bg-black/40 rounded-xl shadow-2xl overflow-hidden relative backdrop-blur-md">
                                <div className="flex items-center px-4 py-2.5 bg-black/40 border-b border-white/10 gap-4 backdrop-blur-xl">
                                    <div className="flex items-center gap-2 text-slate-300 font-bold text-xs min-w-max uppercase tracking-wider">
                                        <span className="material-symbols-outlined text-indigo-300 text-[18px] drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">code</span>
                                        Workspace
                                    </div>
                                    
                                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 gap-1 ml-2">
                                        <button 
                                            onClick={() => setActiveTab('code')}
                                            className={clsx(
                                                "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                                                activeTab === 'code' ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/35" : "text-slate-500 hover:text-slate-300"
                                            )}
                                        >
                                            Code
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('whiteboard')}
                                            className={clsx(
                                                "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                                                activeTab === 'whiteboard' ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/35" : "text-slate-500 hover:text-slate-300"
                                            )}
                                        >
                                            Whiteboard
                                        </button>
                                    </div>

                                    <div className="h-4 w-px bg-white/10 mx-2"></div>
                                    
                                    {activeTab === 'code' && (
                                        <>
                                            <div className="flex items-center bg-black/50 border border-white/10 rounded-md text-xs overflow-hidden shadow-inner transition-colors focus-within:border-indigo-500/50">
                                                <select 
                                                    value={language} 
                                                    onChange={handleLanguageChange}
                                                    className="appearance-none bg-transparent border-none outline-none font-semibold text-slate-300 cursor-pointer px-3 py-1.5 focus:ring-0 [&>option]:bg-slate-900"
                                                >
                                                    <option value="javascript">JavaScript</option>
                                                    <option value="python">Python</option>
                                                    <option value="c++">C++</option>
                                                    <option value="java">Java</option>
                                                </select>
                                            </div>
                                            <button
                                                onClick={handleRun}
                                                disabled={output === 'Running...' || isExecuting}
                                                className={`px-4 py-1.5 rounded-md shadow-sm text-xs font-bold border transition-all flex items-center gap-2 ${
                                                    output === 'Running...' || isExecuting 
                                                    ? 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed' 
                                                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35 hover:bg-indigo-500/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                                                }`}
                                                title="Run Code"
                                            >
                                                {isExecuting ? (
                                                    <span className="w-4 h-4 border-2 border-indigo-300/40 border-t-indigo-300 rounded-full animate-spin"></span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-[16px] drop-shadow-sm">play_arrow</span>
                                                )}
                                                <span className="drop-shadow-sm">Run</span>
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting}
                                                className={`px-4 py-1.5 rounded-md shadow-sm text-xs font-bold border transition-all flex items-center gap-2 ${
                                                    isSubmitting
                                                        ? 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
                                                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35'
                                                }`}
                                                title="Submit Code"
                                            >
                                                {isSubmitting ? (
                                                    <span className="w-4 h-4 border-2 border-indigo-300/40 border-t-indigo-300 rounded-full animate-spin"></span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-[16px] drop-shadow-sm">task_alt</span>
                                                )}
                                                <span className="drop-shadow-sm">Submit</span>
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="flex-1 relative bg-[#0a0f1d]/50">
                                    {activeTab === 'code' ? (
                                        <Editor
                                            height="100%"
                                            language={language === 'c++' ? 'cpp' : language}
                                            value={code}
                                            onChange={handleEditorChange}
                                            theme="vs-dark"
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 14,
                                                lineHeight: 24,
                                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                                fontLigatures: true,
                                                scrollBeyondLastLine: false,
                                                automaticLayout: true,
                                                padding: { top: 16 },
                                            }}
                                        />
                                    ) : (
                                        <Whiteboard roomId={roomId} socket={socket} />
                                    )}
                                </div>
                            </Panel>

                            <Separator className="h-2 transition-colors cursor-row-resize flex items-center justify-center relative touch-none group">
                                <div className="w-8 h-1 bg-white/20 rounded-full"></div>
                            </Separator>

                            {/* Bottom: Terminal Output */}
                            <Panel defaultSize={30} minSize={15} className="flex min-h-0 flex-col room-panel bg-black/40 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-black/40 border-b border-white/10 backdrop-blur-xl shrink-0">
                                    <span className="material-symbols-outlined text-[16px] text-slate-400">terminal</span>
                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Output</span>
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto bg-black/60 text-slate-300 font-mono text-xs custom-scrollbar">
                                    {output ? (
                                        <pre className="whitespace-pre-wrap">{output}</pre>
                                    ) : runResult ? (
                                        <div className="space-y-4">
                                            {runResult.map((res, i) => {
                                                const passed = res?.status?.id === 3;
                                                const input = res?.stdin ?? '';
                                                const expected = res?.expected_output ?? '';
                                                const actual = res?.stdout ?? res?.compile_output ?? res?.stderr ?? res?.message ?? '';

                                                return (
                                                <div key={i} className={`p-4 rounded-lg border backdrop-blur-sm ${passed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.05)]'}`}>
                                                    <div className="font-bold mb-2 flex items-center gap-2 text-sm drop-shadow-sm">
                                                        {passed ? <span className="material-symbols-outlined text-[18px]">check_circle</span> : <span className="material-symbols-outlined text-[18px]">error</span>}
                                                        Testcase {i + 1}
                                                    </div>
                                                    <div className="mt-2 space-y-1.5 bg-black/30 p-3 rounded border border-white/5 shadow-inner">
                                                        <div><span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Input:</span> <span className="text-slate-200">{input || 'None'}</span></div>
                                                        {!passed && <div><span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Expected:</span> <span className="text-slate-200">{expected || 'None'}</span></div>}
                                                        <div><span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Output:</span> <span className={passed ? 'text-emerald-300' : 'text-rose-300'}>{actual || 'None'}</span></div>
                                                        {!passed && !!res?.status?.description && (
                                                            <div><span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Status:</span> <span className="text-rose-300">{res.status.description}</span></div>
                                                        )}
                                                    </div>
                                                </div>
                                            )})}
                                        </div>
                                    ) : submitResult ? (
                                        <div className={`p-4 rounded-lg border ${submitResult.error ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200'}`}>
                                            <div className="font-semibold mb-2">Submission Result</div>
                                            <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(submitResult, null, 2)}</pre>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-500/50 italic font-sans flex-col gap-2">
                                            <span className="material-symbols-outlined text-4xl opacity-50">code_blocks</span>
                                            Run your code to see output here.
                                        </div>
                                    )}
                                </div>
                            </Panel>
                        </Group>
                    </Panel>

                    <Separator className={clsx("w-2 cursor-col-resize flex flex-col justify-center items-center group touch-none", mode === 'ai' && 'order-2')}>
                        <div className="h-6 w-1 bg-white/20 rounded-full" />
                    </Separator>

                    {/* RIGHT PANEL: Interviewer Camera / AI & Instructions */}
                    <Panel defaultSize={mode === 'ai' ? 50 : 25} minSize={20} className={clsx("flex h-full min-h-0 flex-col room-panel bg-black/30 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl", mode === 'ai' && 'order-1')}>
                        <div className={`p-4 bg-black/60 border-b border-white/10 text-white ${mode === 'ai' ? 'min-h-[300px]' : 'flex-1'} flex flex-col justify-between relative`}>
                            <div className="flex justify-between items-start absolute top-4 left-4 right-4 z-20">
                                <div className="font-bold text-sm tracking-wide text-slate-200 drop-shadow-md bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px] text-indigo-300">{mode === 'ai' ? 'smart_toy' : 'video_camera_front'}</span>
                                    {mode === 'ai' ? 'CodeBot AI' : 'Peer Interviewer'}
                                </div>
                                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                                    <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Live</span>
                                </div>
                            </div>
                            
                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                {mode === 'ai' ? (
                                     <>
                                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-black/60 z-0"></div>
                                        {/* AI Avatar */}
                                        <div className="relative z-10 w-32 h-32 rounded-full border border-indigo-500/50 p-2 flex items-center justify-center bg-black/40 shadow-[0_0_50px_rgba(99,102,241,0.3)] backdrop-blur-md">
                                            <div className={`w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-sky-600 shadow-inner transition-transform duration-300 ${isListening ? 'scale-105' : 'scale-100'}`}>
                                                <span className="material-symbols-outlined text-5xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">smart_toy</span>
                                            </div>
                                            {/* Ripple effect when listening */}
                                            {isListening && (
                                                <>
                                                    <div className="absolute inset-0 rounded-full border border-indigo-400/50 animate-ping opacity-75"></div>
                                                    <div className="absolute -inset-4 rounded-full border border-sky-400/30 animate-pulse opacity-50"></div>
                                                </>
                                            )}
                                        </div>
                                     </>
                                ) : (
                                     <>
                                        {/* Remote Video (Peer) */}
                                        <video 
                                            ref={remoteVideoRef} 
                                            autoPlay 
                                            playsInline 
                                            onClick={handleEnableRemoteAudio}
                                            className="w-full h-full object-cover bg-black"
                                        />
                                        {remoteAudioBlocked && (
                                            <button
                                                type="button"
                                                onClick={handleEnableRemoteAudio}
                                                className="absolute top-20 right-4 z-20 rounded-md border border-amber-400/40 bg-amber-500/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-200"
                                            >
                                                Tap To Enable Audio
                                            </button>
                                        )}
                                        {/* Local Video Placeholder */}
                                        <div className="absolute bottom-4 right-4 w-32 h-40 bg-black/60 rounded-xl border border-white/20 overflow-hidden shadow-2xl backdrop-blur-md z-20">
                                            <video 
                                                ref={localVideoRef} 
                                                autoPlay 
                                                playsInline 
                                                muted 
                                                className="w-full h-full object-cover"
                                            />
                                            {!hasCameraAccess && (
                                                <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                                                    <span className="material-symbols-outlined text-slate-500 text-3xl">videocam_off</span>
                                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Camera Off</span>
                                                    <button
                                                        type="button"
                                                        onClick={handleRetryCamera}
                                                        className="mt-1 rounded border border-amber-400/40 bg-amber-500/20 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-200"
                                                    >
                                                        Enable Camera
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                     </>
                                )}
                            </div>

                        {/* Audio & Settings Controls (Only for AI) */}
                        {mode === 'ai' && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-xl px-2 py-2 rounded-full border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-20">
                                <button
                                    onClick={toggleMicrophone}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                                        isListening 
                                        ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] scale-110' 
                                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 hover:border-white/20 hover:text-white'
                                    }`}
                                    title={isListening ? "Stop Speaking" : "Start Speaking"}
                                >
                                    <span className="material-symbols-outlined text-2xl drop-shadow-sm">
                                        {isListening ? 'mic' : 'mic_none'}
                                    </span>
                                </button>
                                
                                <div className={`px-4 text-xs font-bold uppercase tracking-wider transition-opacity duration-300 ${isListening ? 'text-rose-400 opacity-100' : 'text-slate-500 opacity-60'}`}>
                                    {isListening ? 'Listening...' : 'Tap to speak'}
                                </div>
                            </div>
                        )}
                        
                        {/* Status indicators */}
                        <div className="absolute top-16 left-4 bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 flex flex-col gap-2 z-20 shadow-xl max-h-[150px] overflow-y-auto custom-scrollbar">
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Participants</div>
                            {users.map((u, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0"></div>
                                    <div className="flex min-w-0 flex-col">
                                        <span className="truncate max-w-[120px] font-medium">{u.firstName || 'User'}</span>
                                        {!!u.cvFileName && <span className="truncate max-w-[120px] text-[10px] text-indigo-300">CV: {u.cvFileName}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {cvFileName && mode === 'ai' && (
                            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-2 rounded-lg backdrop-blur-md z-20 shadow-lg">
                                <span className="material-symbols-outlined text-[16px] drop-shadow-sm">description</span>
                                <span className="truncate max-w-[150px] drop-shadow-sm">Context: {cvFileName}</span>
                            </div>
                        )}
                        </div>

                        {mode === 'ai' ? (
                            <div className="flex-1 p-5 overflow-y-auto bg-black/40 flex flex-col custom-scrollbar">
                                <div className="flex items-center gap-2 mb-4 shrink-0">
                                    <span className="material-symbols-outlined text-slate-400 text-[18px]">forum</span>
                                    <h3 className="font-bold text-slate-300 text-xs uppercase tracking-wider">Interview Transcript</h3>
                                </div>
                                
                                {aiResponses.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                                            <span className="material-symbols-outlined text-3xl text-slate-500">record_voice_over</span>
                                        </div>
                                        <p className="text-slate-400 text-sm max-w-[200px]">No transcript available yet. Turn on your microphone to begin.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 pb-4">
                                        {aiResponses.map((msg, i) => {
                                            const isUser = msg.startsWith('You:');
                                            const content = msg.replace('You: ', '').replace('Interviewer: ', '');
                                            return (
                                                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                    {!isUser && (
                                                        <div className="w-6 h-6 rounded-full bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center shrink-0 mr-2 mt-1">
                                                            <span className="material-symbols-outlined text-[12px] text-emerald-300">smart_toy</span>
                                                        </div>
                                                    )}
                                                    <div className={`p-3.5 rounded-2xl text-sm max-w-[85%] shadow-md backdrop-blur-sm ${
                                                        isUser 
                                                        ? 'bg-gradient-to-br from-teal-500/20 to-blue-500/20 text-teal-100 border border-teal-500/30 rounded-tr-sm' 
                                                        : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-sm'
                                                    }`}>
                                                        {content}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={chatEndRef} />
                                    </div>
                                )}
                                
                                <form onSubmit={handleSendAiMessage} className="mt-auto p-3 bg-black/40 border-t border-white/10 flex gap-2 rounded-xl sticky bottom-0">
                                    <input 
                                        type="text" 
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Type your answer here..."
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!chatInput.trim()}
                                        className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">send</span>
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col overflow-hidden bg-black/40">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400 text-[18px]">chat</span>
                                        <h3 className="font-bold text-slate-300 text-xs uppercase tracking-wider">Peer Chat</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500">{peerMessages.length} Messages</span>
                                </div>
                                <div ref={peerChatListRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3">
                                    {peerMessages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-4">
                                             <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                                             <p className="text-xs">No messages yet. Say hi to your peer!</p>
                                        </div>
                                    ) : (
                                        peerMessages.map((msg, idx) => (
                                            <div key={idx} className={clsx("flex flex-col", msg.sender === user.firstName ? "items-end" : "items-start")}>
                                                <span className="text-[10px] text-slate-500 mb-1 px-1">{msg.sender}</span>
                                                <div className={clsx(
                                                    "px-3 py-2 rounded-xl text-xs max-w-[90%] break-words shadow-sm",
                                                    msg.sender === user.firstName 
                                                    ? "bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 rounded-tr-none" 
                                                    : "bg-white/5 text-slate-300 border border-white/10 rounded-tl-none"
                                                )}>
                                                    {msg.message}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                                <form onSubmit={handleSendPeerMessage} className="p-3 bg-black/40 border-t border-white/10 flex gap-2">
                                    <input 
                                        type="text" 
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Send a message..."
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!chatInput.trim()}
                                        className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">send</span>
                                    </button>
                                </form>
                            </div>
                        )}
                    </Panel>

                </Group>
                )}
            </main>

            {/* Feedback Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 bg-[#0a0f1d]/80 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="room-panel bg-black/40 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
                        {/* Modal background glow */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none"></div>
                        
                        <div className="px-8 py-6 flex items-center justify-between text-white shrink-0 border-b border-white/10 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/35 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.35)]">
                                    <span className="material-symbols-outlined text-3xl text-indigo-300 drop-shadow-sm">assignment_turned_in</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight drop-shadow-sm">Interview Feedback Report</h2>
                                    <p className="text-indigo-300/90 text-sm font-medium">Powered by CodeBot AI</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowReportModal(false)}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-105"
                            >
                                <span className="material-symbols-outlined text-slate-300">close</span>
                            </button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 prose prose-sm prose-invert prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-indigo-300 prose-strong:text-slate-100 max-w-none text-slate-300 bg-black/20">
                            {reportData ? (
                                <ReactMarkdown>{reportData}</ReactMarkdown>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 gap-3 opacity-60">
                                    <span className="material-symbols-outlined text-5xl animate-pulse">pending</span>
                                    <p className="italic font-medium">Processing feedback...</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="px-8 py-5 border-t border-white/10 bg-black/40 flex justify-end gap-4 shrink-0 backdrop-blur-md">
                            <button 
                                onClick={() => window.print()}
                                className="px-6 py-2.5 bg-white/5 border border-white/10 text-slate-200 rounded-lg hover:bg-indigo-500/15 hover:border-indigo-400/40 transition-colors font-bold text-sm shadow-sm flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">print</span>
                                Save PDF
                            </button>
                            <Link 
                                to="/" 
                                className="px-6 py-2.5 bg-indigo-600/85 hover:bg-indigo-600 text-white border border-indigo-400/50 rounded-lg transition-all font-bold text-sm shadow-[0_0_15px_rgba(99,102,241,0.35)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">home</span>
                                Go Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* End Interview Choice Modal (AI only) */}
            {showEndChoiceModal && (
                <div className="fixed inset-0 z-50 bg-[#0a0f1d]/80 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="room-panel bg-black/40 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-white/10 bg-black/30">
                            <h3 className="text-white text-xl font-bold">End AI Interview</h3>
                            <p className="text-slate-400 text-sm mt-1">Choose what you want to do next.</p>
                        </div>
                        <div className="p-6 space-y-3">
                            <button
                                onClick={handleGenerateReportChoice}
                                disabled={isGeneratingReport}
                                className="w-full text-left px-4 py-3 rounded-lg border border-indigo-400/35 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25 disabled:opacity-60"
                            >
                                Generate Feedback Report
                            </button>
                            <button
                                onClick={handleExitToDashboard}
                                className="w-full text-left px-4 py-3 rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                        <div className="px-6 py-4 border-t border-white/10 bg-black/25 flex justify-end">
                            <button
                                onClick={() => setShowEndChoiceModal(false)}
                                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MockInterviewPage;
