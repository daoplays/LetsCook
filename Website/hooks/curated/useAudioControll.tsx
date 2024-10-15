import { useState, useRef } from "react";

const useAudioPlayer = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null); // Reference to the audio element
    const [isMusicPlaying, setIsMusicPlaying] = useState(false); // Track if music is playing
    const [isMuted, setIsMuted] = useState(false); // Track mute state
    const [showControls, setShowControls] = useState(false); // Track visibility of controls

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isMusicPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch((error) => {
                    console.error("Playback failed:", error); // Log any errors during playback
                });
            }
            setIsMusicPlaying(!isMusicPlaying);
            setIsMuted(!isMusicPlaying ? false : isMuted); // Ensure mute state is consistent when toggling
        }
    };

    const toggleControlsOff = () => {
        setShowControls(false);
    };
    const toggleControlsOn = () => {
        setShowControls(true);
    };
    const toggleControls = () => {
        setShowControls(!showControls);
    };

    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            const volume = parseFloat(event.target.value);
            audioRef.current.volume = volume;
            setIsMuted(volume === 0);
            setIsMusicPlaying(volume !== 0);
        }
    };

    return {
        audioRef,
        isMusicPlaying,
        isMuted,
        showControls,
        togglePlayPause,
        toggleControls,
        toggleControlsOff,
        handleVolumeChange,
    };
};

export default useAudioPlayer;
