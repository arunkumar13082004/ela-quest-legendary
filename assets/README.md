# Asset Notes

This project uses generated vector textures for core game visuals (gates, characters, cards, particles) so it can run without local binary assets.

Audio is loaded from royalty-free Pixabay URLs in `js/systems/AudioSystem.js`.

If you want to ship offline:

1. Download each Pixabay file.
2. Place files in `assets/music` and `assets/sounds`.
3. Update `AUDIO_LIBRARY` paths to local files.

Suggested attribution format:

- "Audio by Pixabay contributors" with links to each track source page.
