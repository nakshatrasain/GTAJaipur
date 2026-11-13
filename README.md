# GTA: Gulabi Town Adventures · Jaipur

A small 3D open-city adventure set in **Jaipur, the Pink City**, played from a third-person camera. Ride a scooty, a Bullet, an auto, a hatchback or a jeep through the walled city. Grab kachori before ten, brew a pour-over at Curious Life, block-print a mural at JKK, chase down the goons who stole Dadi's recipe diary, and make it to Nahargarh for the sunset food fest.

It's built with three.js r128, loaded from cdnjs with a local copy in `vendor/` as a fallback. The city, characters and vehicles are all built in code from simple shapes, so there are no model or image files and no build step.

## Play

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000. It also works on GitHub Pages: set Pages to deploy from the branch root.

| Keys | Action |
|---|---|
| `W A S D` / arrows | Walk (A/D turn) or drive |
| Drag the mouse | Look around |
| `C` | Look behind |
| `Space` | Handbrake (drift!) |
| `E` | Get in or off a vehicle, pick up a fallen bike, walk in to eat, talk |
| `H` | Horn (pom pom) |
| `M` / `J` | Map / Jaipur Diary |
| `Shift` | Run |
| `Esc` | Pause |

On phones you get an on-screen joystick plus E, Horn, Brake and Rev buttons.

## Eating

Food is a sit-down moment, not a menu. Park, walk in, and you're seated at the table in first person with a friend across from you. The plate arrives: crisp pyaaz kachori with imli and hari chutney, kulhad chai with bun maska, lassi topped with malai, ghewar, kesar kulfi, or a latte with a heart on top. Press Space to bite (crunch, crumbs fly) or sip (slurp, then "aah"), and B for the bun maska. Your friend chats while you eat.

| Dish | Where |
|---|---|
| Pyaaz kachori | Samrat, Rawat |
| Aloo kachori | Sampat Namkeen Bhandar |
| Ghewar | LMB |
| Kulhad lassi | Lassiwala |
| Chai + bun maska | Gulab Ji Chai, Tapri Central |
| Kesar kulfi | Pandit Kulfi |
| Coffee | Curious Life (brew it yourself), Half Light, The Usual, Doppler, Rustic by OTH |

## Driving

A speedometer and a how-to card appear when you first get in. Two-wheelers lean into turns, cars pitch when braking, autos rattle, and the camera shakes more on rough ground. Hit something above about 45 km/h on two wheels and you come off: your character is thrown, the bike falls on its side, and you press E to pick it up. Knock into another rider and they go down too.

## The story: 8 chapters

1. **Ghar Wapsi.** Arrive at Jaipur Junction, pick a ride at Chintu's Garage, take the Hawa Mahal photo.
2. **Kachori Before Ten.** Get to Samrat Kachori against the clock and get it to Dadi while it's hot.
3. **Curious Life.** The full coffee sequence: walk in, order, brew it yourself (pour-over, steamed milk or cold brew), sip, meet Meera.
4. **Rang Bazaar.** Collect pigments from Bapu Bazaar, Johari Bazaar and Tripolia, then block-print the JKK wall. Your mural shows up in the world.
5. **Auto Raja.** Drive two tourists from Albert Hall up to Amer Fort in Raju's auto.
6. **Masala Chor.** Chase down Bunty Builder's black SUV and ram it to get the recipe diary back.
7. **The Usual Suspects.** Breakfast at The Usual, invite Sampat, LMB and Lassiwala, then pick up the posters at Doppler.
8. **Gulabi Sunset.** Race Dadi's kachori to Nahargarh with goons on your tail.

After that, free roam stays open. Fill the **Jaipur Diary** (40 places, each with a short fact). At any red food dot you can stop to eat, which refills your Josh. Hitting cows or people, or taking someone's vehicle, earns challan stars, and Traffic Mamu comes after you.

## Places on the map

The real places were checked against public listings (Nov 2026). The map is still stylised, so each one sits in the right neighbourhood rather than at its exact street address.

| Place | Where it really is |
|---|---|
| Curious Life Coffee Roasters | C-54A Sarojini Marg, Panch Batti, C-Scheme |
| Half Light Coffee Roasters | F-31 Azad Marg, C-Scheme |
| Rustic by OTH | C-Scheme |
| Pandit Kulfi | Hawa Mahal Bazaar |
| Samrat (pyaaz kachori since 1965) | Chaura Rasta, walled city |
| Sampat Namkeen Bhandar (aloo kachori since 1936) | Kishanpole Bazaar |
| Rawat Mishthan Bhandar | Station Road, opposite Polo Victory, Sindhi Camp |
| LMB | Johari Bazaar Road |
| Lassiwala (since 1944) | 312 MI Road |
| Gulab Ji Chai | Ganpati Plaza, MI Road |
| Tapri Central | B4-E Prithviraj Marg, opposite the Central Park gate |
| Doppler Coffee | Kamla Marg, C-Scheme |
| The Usual | Devi Niwas, Dhuleshwar Garden, C-Scheme |
| Masala Chowk | Ram Niwas Garden, next to Albert Hall |

Dadi's Kachori Corner, Chintu's Garage and the characters are fictional parts of the story.

### All places

Hawa Mahal, City Palace, Jantar Mantar, Badi & Chhoti Chaupar, Tripolia Bazaar, Bapu Bazaar, Johari Bazaar, Amer Fort, Panna Meena ka Kund, Nahargarh, Jal Mahal, Galta Ji, Jaipur Junction, Sindhi Camp, Raj Mandir, Albert Hall, Masala Chowk, Statue Circle, Central Park, Birla Mandir, Moti Doongri, SMS Stadium, Rambagh Palace, JKK, World Trade Park, Patrika Gate, Jawahar Circle, Chokhi Dhani.

**Food & cafes:** Samrat, Sampat Namkeen Bhandar, Rawat (pyaaz kachori), LMB, Lassiwala, Gulab Ji Chai, Masala Chowk, Tapri Central, Raja Park, Chokhi Dhani, **Curious Life**, **Doppler**, **The Usual Cafe**.


## Code map

```
index.html        page + HUD markup
css/tokens.css    design tokens (colour, type, spacing, radius, motion)
css/ui.css        HUD, dialog, scenes
js/data.js        places, vehicles, cast, story (edit this to add missions)
js/map.js         city layout (tile grid), ground texture painter
js/city3d.js      three.js world: terrain, buildings, landmarks, signs, people, vehicles, camera, day/night
js/draw.js        2D art for the scenes (coffee, food, mural, photo, title)
js/world.js       driving physics, traffic AI, police, pedestrians
js/missions.js    story engine
js/scenes.js      garage, photo, coffee, eating, mural, finale
js/ui.js          HUD, minimap, map, diary
js/audio.js       synth sounds + raag-style background music
js/main.js        loop, input, camera, save/load
```

Progress saves automatically in the browser's localStorage.
