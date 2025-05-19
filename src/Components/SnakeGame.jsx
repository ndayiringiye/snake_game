import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Pause, Play, RotateCcw, RefreshCcw } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const GAME_SPEED = 150;
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

export default function SnakeGame() {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(DIRECTIONS.RIGHT);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const gameLoopRef = useRef(null);
  
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    
    if (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      return generateFood(); 
    } else {
      setFood(newFood);
    }
  }, [snake]);
  
  const checkCollision = useCallback((head) => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    
    return snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
  }, [snake]);
  
  const handleGameOver = useCallback(() => {
    clearInterval(gameLoopRef.current);
    setGameOver(true);
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);
  
  const moveSnake = useCallback(() => {
    const newSnake = [...snake];
    const head = { ...newSnake[0] };
    
    head.x += direction.x;
    head.y += direction.y;
    
    if (checkCollision(head)) {
      handleGameOver();
      return;
    }
    
    newSnake.unshift(head);
    
    if (head.x === food.x && head.y === food.y) {
      setScore(prevScore => prevScore + 10);
      generateFood();
    } else {
      newSnake.pop();
    }
    
    setSnake(newSnake);
  }, [snake, direction, food, checkCollision, generateFood, handleGameOver]);
  
  const startGameLoop = useCallback(() => {
    clearInterval(gameLoopRef.current);
    gameLoopRef.current = setInterval(() => {
      if (!isPaused && !gameOver) {
        moveSnake();
      }
    }, GAME_SPEED);
  }, [isPaused, gameOver, moveSnake]);
  
  const resetGame = useCallback(() => {
    clearInterval(gameLoopRef.current);
    setSnake([{ x: 10, y: 10 }]);
    setDirection(DIRECTIONS.RIGHT);
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    
    setTimeout(() => {
      const newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      setFood(newFood);
      
      gameLoopRef.current = setInterval(() => {
        if (!isPaused && !gameOver) {
          moveSnake();
        }
      }, GAME_SPEED);
    }, 0);
  }, [isPaused, gameOver, moveSnake]);
  
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);
  
  const handleKeyPress = useCallback((e) => {
    e.preventDefault();
    
    switch (e.key) {
      case 'ArrowUp':
        if (direction !== DIRECTIONS.DOWN) setDirection(DIRECTIONS.UP);
        break;
      case 'ArrowDown':
        if (direction !== DIRECTIONS.UP) setDirection(DIRECTIONS.DOWN);
        break;
      case 'ArrowLeft':
        if (direction !== DIRECTIONS.RIGHT) setDirection(DIRECTIONS.LEFT);
        break;
      case 'ArrowRight':
        if (direction !== DIRECTIONS.LEFT) setDirection(DIRECTIONS.RIGHT);
        break;
      case ' ':
        togglePause();
        break;
      case 'r':
        resetGame();
        break;
      default:
        break;
    }
  }, [direction, togglePause, resetGame]);
  
  const handleDirectionButton = useCallback((newDirection) => {
    const opposites = {
      [DIRECTIONS.UP]: DIRECTIONS.DOWN,
      [DIRECTIONS.DOWN]: DIRECTIONS.UP,
      [DIRECTIONS.LEFT]: DIRECTIONS.RIGHT,
      [DIRECTIONS.RIGHT]: DIRECTIONS.LEFT
    };
    
    if (opposites[newDirection].x !== direction.x || opposites[newDirection].y !== direction.y) {
      setDirection(newDirection);
    }
  }, [direction]);
  
  useEffect(() => {
    generateFood();
    
    document.addEventListener('keydown', handleKeyPress);
    
    startGameLoop();
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      clearInterval(gameLoopRef.current);
    };
  }, [generateFood, handleKeyPress, startGameLoop]);
  
  useEffect(() => {
    if (!gameOver) {
      startGameLoop();
    }
    return () => clearInterval(gameLoopRef.current);
  }, [isPaused, gameOver, startGameLoop]);
  
  const renderBoard = () => {
    const cells = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isSnakeHead = snake[0].x === x && snake[0].y === y;
        const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
        const isFood = food.x === x && food.y === y;
        
        let cellClass = 'bg-gray-800';
        
        if (isSnakeHead) {
          cellClass = 'bg-green-500 rounded-md shadow-lg';
        } else if (isSnakeBody) {
          cellClass = 'bg-green-400 rounded-md';
        } else if (isFood) {
          cellClass = 'bg-red-500 rounded-full';
        }
        
        cells.push(
          <div
            key={`${x}-${y}`}
            className={`${cellClass} transition-all duration-100`}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              position: 'absolute',
              left: x * CELL_SIZE,
              top: y * CELL_SIZE
            }}
          />
        );
      }
    }
    
    return cells;
  };
  
  return (
   <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4 py-6 sm:px-6 lg:px-8">
  <div className="flex flex-col items-center mb-6 text-center">
    <div className="flex items-center justify-center">
      <div className="mr-2 text-green-400">🐍</div>
      <h1 className="text-3xl font-bold">Snake Game</h1>
    </div>
    <p className="text-gray-400 mt-1 text-sm sm:text-base">Use arrow keys or buttons to control the snake</p>
  </div>

  <div className="flex flex-col md:flex-row items-center md:items-start gap-8 w-full max-w-5xl">
    <div className="relative bg-gray-800 rounded-lg shadow-2xl overflow-hidden border-2 border-gray-700">
      <div 
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          position: 'relative'
        }}
      >
        {renderBoard()}
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center">
            <h2 className="text-xl font-bold text-red-500 mb-2">Game Over</h2>
            <p className="text-gray-300 mb-4">Your Score: {score}</p>
            <button 
              onClick={resetGame}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md flex items-center"
            >
              <RefreshCcw size={16} className="mr-2" />
              Play Again
            </button>
          </div>
        )}
        {isPaused && !gameOver && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <h2 className="text-xl font-bold text-yellow-500">PAUSED</h2>
          </div>
        )}
      </div>
    </div>
    <div className="flex flex-col items-center md:items-start w-full md:max-w-sm space-y-6">
      <div className="bg-gray-800 rounded-lg p-4 w-full text-center">
        <h2 className="text-lg font-semibold mb-2">Score</h2>
        <div className="flex justify-around">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Current</p>
            <p className="text-2xl font-bold text-green-400">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">High Score</p>
            <p className="text-2xl font-bold text-yellow-400">{highScore}</p>
          </div>
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg p-4 w-full">
        <h2 className="text-lg font-semibold mb-2 text-center">Controls</h2>
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto mb-4">
          <div></div>
          <button 
            onClick={() => handleDirectionButton(DIRECTIONS.UP)}
            className="bg-gray-700 hover:bg-gray-600 flex items-center justify-center p-3 rounded-md"
          >
            <ArrowUp size={20} />
          </button>
          <div></div>
          <button 
            onClick={() => handleDirectionButton(DIRECTIONS.LEFT)}
            className="bg-gray-700 hover:bg-gray-600 flex items-center justify-center p-3 rounded-md"
          >
            <ArrowLeft size={20} />
          </button>
          <div></div>
          <button 
            onClick={() => handleDirectionButton(DIRECTIONS.RIGHT)}
            className="bg-gray-700 hover:bg-gray-600 flex items-center justify-center p-3 rounded-md"
          >
            <ArrowRight size={20} />
          </button>
          <div></div>
          <button 
            onClick={() => handleDirectionButton(DIRECTIONS.DOWN)}
            className="bg-gray-700 hover:bg-gray-600 flex items-center justify-center p-3 rounded-md"
          >
            <ArrowDown size={20} />
          </button>
          <div></div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button 
            onClick={togglePause}
            className="bg-gray-700 hover:bg-gray-600 flex items-center justify-center px-4 py-2 rounded-md"
          >
            {isPaused ? <Play size={16} className="mr-1" /> : <Pause size={16} className="mr-1" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button 
            onClick={resetGame}
            className="bg-gray-700 hover:bg-gray-600 flex items-center justify-center px-4 py-2 rounded-md"
          >
            <RotateCcw size={16} className="mr-1" />
            Reset
          </button>
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg p-4 w-full">
        <h2 className="text-lg font-semibold mb-2 text-center">Instructions</h2>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Use arrow keys or buttons to move</li>
          <li>• Collect red food to grow and earn points</li>
          <li>• Avoid hitting walls or yourself</li>
          <li>• Press Space to pause/resume</li>
          <li>• Press R to restart the game</li>
        </ul>
      </div>
    </div>
  </div>
</div>
  );
}