# Apple Video Player Redesign - Implementation Steps

## Step 1: Remove Violet/Purple Colors
- [x] Replace all bg-violet-600 with bg-white or appropriate minimal colors
- [x] Replace text-violet-400 with text-white or text-gray-300
- [x] Remove shadow-violet-500/20 and similar glow effects
- [x] Update accent colors to white/gray

## Step 2: Remove Glow Effects and Blur
- [x] Remove blur-xl, blur-lg classes
- [x] Remove backdrop-blur-xl effects
- [x] Remove shadow effects with violet colors

## Step 3: Remove Pulsing Animations
- [x] Remove animate-pulse classes
- [x] Keep only smooth transitions

## Step 4: Redesign Play Button (Apple Style)
- [x] Change play button to white circle with black play icon
- [x] Update hover states to minimal gray

## Step 5: Clean Progress Bar
- [x] Make progress bar thin white line
- [x] Remove accent colors from progress styling

## Step 6: Minimal Control Buttons
- [x] Update all control buttons to white icons on transparent
- [x] Remove colored backgrounds and borders
- [x] Use gray hover states

## Step 7: Clean Episode/Server Selectors
- [x] Update EpisodeSelector to minimal gray backgrounds
- [x] Update ServerSelector to minimal styling
- [x] Remove violet accents

## Step 8: Update Loading and Error States
- [x] Remove violet colors from loading spinners
- [x] Update error states to minimal styling

## Step 9: Review and Test
- [ ] Verify no violet/purple colors remain
- [ ] Check all controls work properly
- [ ] Test responsive layout
