# 🎮 AI-Enhanced Retro Minesweeper

A modern take on the classic Windows Minesweeper game, featuring authentic Win95-style visuals combined with intelligent AI assistance. Experience nostalgic gameplay enhanced with smart hints, adaptive difficulty, and intelligent mine placement.

![Minesweeper Screenshot](https://img.shields.io/badge/Status-Complete-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)

## ✨ Features

### 🎯 Classic Minesweeper Gameplay
- **Left-click** to reveal cells
- **Right-click** to flag suspected mines
- **Flood fill** algorithm for empty cell reveals
- **Win/Loss detection** with proper game state management
- **Multiple difficulty levels**: Beginner (9×9), Intermediate (16×16), Expert (30×16)

### 🎨 Authentic Win95 Styling
- **Raised/depressed button-style cells** with classic gray color scheme
- **Pixelated fonts** and retro interface elements
- **Traditional mine counter** and timer displays with LED-style numbers
- **Classic status bar** aesthetics with proper Win95 borders
- **Nostalgic color palette** and visual effects

### 🤖 AI-Powered Enhancements
- **Smart Hint System**: Analyzes board state and provides strategic suggestions with detailed reasoning
- **Intelligent Mine Placement**: Ensures solvable boards with anti-clustering algorithms
- **Adaptive Difficulty**: Dynamically adjusts mine count based on player performance
- **Performance Analytics**: Tracks win rate, streaks, and improvement trends

### 💾 Modern Conveniences
- **Automatic game state saving/loading** - Resume interrupted games
- **Player statistics tracking** - Monitor your progress over time
- **Preference persistence** - Saves your settings and difficulty preferences
- **Local storage integration** with error handling and data validation

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Modern web browser with ES2020 support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd retro-ai-minesweeper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Build for Production
```bash
npm run build
npm run preview
```

## 🎮 How to Play

### Basic Controls
- **Left Click**: Reveal a cell
- **Right Click**: Toggle flag on a cell
- **New Game Button**: Start a fresh game
- **Hint Button**: Get AI assistance (💡 icon)

### Game Rules
1. **Objective**: Reveal all cells that don't contain mines
2. **Numbers**: Show how many mines are adjacent to that cell
3. **Flags**: Mark cells you think contain mines
4. **Win**: Reveal all non-mine cells
5. **Lose**: Click on a mine

### AI Features
- **Hint System**: Click the 💡 button for strategic suggestions
- **Adaptive Difficulty**: The game learns from your performance
- **Smart Mine Placement**: Ensures fair, solvable puzzles

## 🏗️ Technical Architecture

### Frontend Stack
- **React 19** with TypeScript for type safety
- **Vite** for fast development and building
- **Custom CSS** with authentic Win95 theming
- **Vitest + fast-check** for testing (property-based testing ready)

### Project Structure
```
src/
├── ai/                     # AI systems
│   ├── hintEngine.ts      # Smart hint generation
│   ├── minePlacer.ts      # Intelligent mine placement
│   └── difficultyAdapter.ts # Adaptive difficulty system
├── components/            # React components
│   ├── Game/             # Main game component
│   ├── Board/            # Game board component
│   ├── Cell/             # Individual cell component
│   └── GameControls/     # Game controls and UI
├── utils/                # Utility functions
│   ├── gameLogic.ts      # Core game mechanics
│   ├── boardUtils.ts     # Board manipulation utilities
│   └── storage.ts        # Local storage management
├── styles/               # CSS styling
│   └── win95.css         # Win95 theme variables and styles
└── types/                # TypeScript type definitions
    └── index.ts          # Shared interfaces and types
```

### Key Components

#### AI Systems
- **HintEngine**: Analyzes board state using logical deduction and probability
- **MinePlacer**: Creates solvable boards with optimal mine distribution
- **DifficultyAdapter**: Adjusts game difficulty based on player performance

#### Game Logic
- **GameBoard**: Manages cell interactions and game state
- **GameLogic**: Core minesweeper mechanics (reveal, flag, flood fill)
- **Storage**: Persistent game state and player statistics

## 🧪 Testing

The project includes comprehensive testing setup:

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run
```

### Testing Strategy
- **Unit Tests**: Component behavior and game logic validation
- **Property-Based Tests**: Universal correctness guarantees using fast-check
- **Integration Tests**: Component interactions and AI system behavior

## 🎯 Game Statistics

The game tracks comprehensive statistics:
- **Games Played/Won**: Overall performance metrics
- **Win Rate**: Success percentage over time
- **Current Streak**: Consecutive wins/losses
- **Average Time**: Time per completed game
- **Hints Used**: AI assistance utilization
- **Difficulty Progression**: Adaptive difficulty changes

## 🔧 Configuration

### Difficulty Levels
- **Beginner**: 9×9 grid, 10 mines
- **Intermediate**: 16×16 grid, 40 mines  
- **Expert**: 30×16 grid, 99 mines

### AI Settings
The AI system automatically adjusts based on:
- Win/loss ratio
- Hint usage patterns
- Game completion times
- Recent performance trends

## 🎨 Customization

### Win95 Theme Variables
The CSS uses custom properties for easy theming:
```css
:root {
  --win95-bg: #c0c0c0;
  --win95-light: #dfdfdf;
  --win95-dark: #808080;
  --win95-text: #000000;
  /* ... more variables */
}
```

### Adding New Difficulty Levels
Update `src/types/index.ts`:
```typescript
export const GAME_CONFIG = {
  beginner: { width: 9, height: 9, mines: 10 },
  // Add new configurations here
} as const;
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow the existing component structure
- Add tests for new features
- Maintain Win95 aesthetic consistency
- Update documentation for API changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original Minesweeper game by Microsoft
- Windows 95 design inspiration
- React and TypeScript communities
- Property-based testing methodology

## 🐛 Known Issues

- None currently reported

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](../../issues) page
2. Create a new issue with detailed description
3. Include browser version and error messages

---

**Enjoy playing AI-Enhanced Retro Minesweeper!** 🎮💣✨