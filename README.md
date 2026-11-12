# GTA: Gulabi Town Adventures · Jaipur

A tiny open-city driving adventure set in **Jaipur, the Pink City**. Ride a scooty, a Bullet, an auto, a hatchback or a jeep through the walled city. Grab kachori before ten, brew a pour-over at Curious Life, block-print a mural at JKK, chase down the goons who stole Dadi's recipe diary, and make it to Nahargarh for the sunset food fest.

There are no image files, no build step and no dependencies: just one HTML page, canvas drawing and a small WebAudio synth.

## Play

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000. It also works on GitHub Pages: set Pages to deploy from the branch root.

| Keys | Action |
|---|---|
| `W A S D` / arrows | Drive or walk |
| `Space` | Handbrake (drift!) |
| `E` | Get in or out of a vehicle, interact, eat |
| `H` | Horn (pom pom) |
| `M` / `J` | Map / Jaipur Diary |
| `Shift` | Run |
| `Esc` | Pause |

On phones you get an on-screen joystick plus E, Horn, Brake and Rev buttons.

## The story: 8 chapters

1. **Ghar Wapsi.** Arrive at Jaipur Junction, pick a ride at Chintu's Garage, take the Hawa Mahal photo.
2. **Kachori Before Ten.** Get to Samrat Kachori against the clock and get it to Dadi while it's hot.
3. **Curious Life.** The full coffee sequence: walk in, order, brew it yourself (pour-over, steamed milk or cold brew), sip, meet Meera.
4. **Rang Bazaar.** Collect pigments from Bapu Bazaar, Johari Bazaar and Tripolia, then block-print the JKK wall. Your mural shows up in the world.
5. **Auto Raja.** Drive two tourists from Albert Hall up to Amer Fort in Raju's auto.
6. **Masala Chor.** Chase down Bunty Builder's black SUV and ram it to get the recipe diary back.
7. **The Usual Suspects.** Brunch at The Usual Cafe, invite Bulabchi, LMB and Lassiwala, then pick up the posters at Doppler.
8. **Gulabi Sunset.** Race Dadi's kachori to Nahargarh with goons on your tail.

After that, free roam stays open. Fill the **Jaipur Diary** (40 places, each with a short fact). At any red food dot you can stop to eat, which refills your Josh. Hitting cows or people, or taking someone's vehicle, earns challan stars, and Traffic Mamu comes after you.

## Places on the map

Hawa Mahal, City Palace, Jantar Mantar, Badi & Chhoti Chaupar, Tripolia, Bapu Bazaar, Johari Bazaar, Amer Fort, Panna Meena ka Kund, Nahargarh, Jal Mahal, Galta Ji, Jaipur Junction, Sindhi Camp, Raj Mandir, Albert Hall, Masala Chowk, Statue Circle, Central Park, Birla Mandir, Moti Doongri, SMS Stadium, Rambagh Palace, JKK, World Trade Park, Patrika Gate, Jawahar Circle, Chokhi Dhani.

**Food & cafes:** Samrat Kachori, Bulabchi Kachori, Rawat (pyaaz kachori), LMB, Lassiwala, Gulab Ji Chai, Masala Chowk, Tapri Central, Raja Park, Chokhi Dhani, **Curious Life**, **Doppler**, **The Usual Cafe**.

The map is stylised: places sit in roughly the right neighbourhoods, not at exact street positions.

## Code map

```
index.html        page + HUD markup
css/tokens.css    design tokens (colour, type, spacing, radius, motion)
css/ui.css        HUD, dialog, scenes
js/data.js        places, vehicles, cast, story (edit this to add missions)
js/map.js         city generation, ground chunks, buildings
js/draw.js        vehicles, people, cows, landmarks, scene art
js/world.js       driving physics, traffic AI, police, pedestrians
js/missions.js    story engine
js/scenes.js      garage, photo, coffee, eating, mural, finale
js/ui.js          HUD, minimap, map, diary
js/audio.js       synth sounds + raag-style background music
js/main.js        loop, input, camera, save/load
```

Progress saves automatically in the browser's localStorage.
