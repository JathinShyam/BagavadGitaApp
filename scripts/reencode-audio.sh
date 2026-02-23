#!/bin/bash

# Re-encode audio files at 128 kbps for better quality
# This will improve voice clarity while keeping file size reasonable

AUDIO_DIR="assets/audios"
BACKUP_DIR="assets/audios_backup_64kbps"
BITRATE="128k"

echo "=== Audio Re-encoding Script ==="
echo "Current bitrate: 64 kbps (poor quality)"
echo "Target bitrate: 128 kbps (good quality for voice)"
echo ""

# Check if ffmpeg is available
if ! command -v ffmpeg &> /dev/null; then
    echo "ERROR: ffmpeg is not installed. Please install it first:"
    echo "  Ubuntu/Debian: sudo apt install ffmpeg"
    echo "  macOS: brew install ffmpeg"
    echo "  Arch: sudo pacman -S ffmpeg"
    exit 1
fi

# Create backup directory
echo "Creating backup of original files..."
mkdir -p "$BACKUP_DIR"

# Count total files
TOTAL=$(find "$AUDIO_DIR" -name "*.mp3" | wc -l)
CURRENT=0

echo "Processing $TOTAL audio files..."
echo ""

# Process each chapter
for chapter_dir in "$AUDIO_DIR"/chapter_*; do
    if [ -d "$chapter_dir" ]; then
        chapter_name=$(basename "$chapter_dir")
        
        # Create backup subdirectory
        mkdir -p "$BACKUP_DIR/$chapter_name"
        
        # Process each verse in the chapter
        for audio_file in "$chapter_dir"/*.mp3; do
            if [ -f "$audio_file" ]; then
                CURRENT=$((CURRENT + 1))
                filename=$(basename "$audio_file")
                
                # Backup original
                cp "$audio_file" "$BACKUP_DIR/$chapter_name/$filename"
                
                # Re-encode with better quality
                ffmpeg -i "$audio_file" -b:a $BITRATE -y "${audio_file}.tmp" -loglevel error
                
                if [ $? -eq 0 ]; then
                    mv "${audio_file}.tmp" "$audio_file"
                    printf "\r[$CURRENT/$TOTAL] Processed: $chapter_name/$filename"
                else
                    echo ""
                    echo "ERROR processing: $audio_file"
                    rm -f "${audio_file}.tmp"
                fi
            fi
        done
    fi
done

echo ""
echo ""
echo "=== Re-encoding Complete ==="

# Show size comparison
OLD_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
NEW_SIZE=$(du -sh "$AUDIO_DIR" | cut -f1)

echo "Original size (64 kbps): $OLD_SIZE"
echo "New size (128 kbps): $NEW_SIZE"
echo ""
echo "Backup saved to: $BACKUP_DIR"
echo "You can delete the backup folder after testing."
echo ""
echo "To verify quality, run:"
echo "  ffprobe assets/audios/chapter_1/verse1.mp3 2>&1 | grep bitrate"
