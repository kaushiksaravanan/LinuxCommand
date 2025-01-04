import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Sword, Shield, Heart, Skull, Star, Zap, Target } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Sword, Shield, Heart, Skull, Star, Zap, Target, ShoppingBag, Coffee, Flame, Wind, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const BOSSES = [
  {
    name: "Typo Terror",
    level: 5,
    health: 150,
    attack: 15,
    defense: 8,
    requiredWPM: 30,
    image: "👹"
  },
  {
    name: "Swift Serpent",
    level: 10,
    health: 200,
    attack: 20,
    defense: 12,
    requiredWPM: 45,
    image: "🐍"
  },
  {
    name: "Keyboard King",
    level: 15,
    health: 300,
    attack: 25,
    defense: 15,
    requiredWPM: 60,
    image: "👑"
  }
];

const SHOP_ITEMS = {
  WEAPON: {
    name: 'Mechanical Keyboard',
    description: '+5 Attack',
    price: 300,
    stat: 'attack',
    boost: 5,
    icon: '⌨️'
  },
  ARMOR: {
    name: 'Typing Gloves',
    description: '+3 Defense',
    price: 250,
    stat: 'defense',
    boost: 3,
    icon: '🧤'
  },
  MAX_HP: {
    name: 'Vitality Crystal',
    description: '+25 Max HP',
    price: 400,
    stat: 'maxHealth',
    boost: 25,
    icon: '💎'
  }
};

const POWER_UPS = {
  SPEED_BOOST: {
    id: 'speed',
    name: 'Speed Potion',
    description: 'Increases WPM bonus by 50% for 30 seconds',
    icon: '⚡',
    price: 100,
    duration: 30000,
    color: 'text-yellow-400'
  },
  HEALING: {
    id: 'heal',
    name: 'Health Potion',
    description: 'Restores 50 HP instantly',
    icon: '❤️',
    price: 150,
    color: 'text-red-400'
  },
  CRITICAL: {
    id: 'crit',
    name: 'Critical Strike',
    description: '25% chance for double damage for 20 seconds',
    icon: '⚔️',
    price: 200,
    duration: 20000,
    color: 'text-purple-400'
  },
  SHIELD: {
    id: 'shield',
    name: 'Magic Shield',
    description: 'Increases defense by 50% for 15 seconds',
    icon: '🛡️',
    price: 175,
    duration: 15000,
    color: 'text-blue-400'
  }
};


const MonkeyTypePro = () => {
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, finished, boss
  const [text, setText] = useState('');
  const [currentInput, setCurrentInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [mistakes, setMistakes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showDamage, setShowDamage] = useState(false);
  const [lastDamage, setLastDamage] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [currentBoss, setCurrentBoss] = useState(null);
  const [playerStats, setPlayerStats] = useState({
    level: 1,
    exp: 0,
    health: 100,
    maxHealth: 100,
    attack: 10,
    defense: 5,
    specialMeter: 0,
  });
  const [gold, setGold] = useState(500);
  const [inventory, setInventory] = useState([]);
  const [activeEffects, setActiveEffects] = useState([]);
  const [showShop, setShowShop] = useState(false);
  const [particles, setParticles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [equipped, setEquipped] = useState({
    weapon: null,
    armor: null,
    accessory: null
  });

  const [opponent, setOpponent] = useState({
    name: "Practice Dummy",
    health: 100,
    maxHealth: 100,
    level: 1,
    image: "🎯"
  });

  const textSnippets = {
    normal: [
      "The quick brown fox jumps over the lazy dog.",
      "Pack my box with five dozen liquor jugs.",
      "How vexingly quick daft zebras jump!",
    ],
    boss: [
      "In the realm of typing, speed and accuracy reign supreme, demanding perfect keystrokes.",
      "Swift fingers dance across the keyboard, weaving patterns of digital mastery.",
      "Through practice and persistence, we achieve typing excellence beyond measure.",
    ]
  };

  const calculateStats = useCallback(() => {
    if (startTime && currentInput.length > 0) {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60;
      const wordsTyped = currentInput.trim().split(' ').length;
      const newWpm = Math.round(wordsTyped / timeElapsed);
      
      const correctChars = currentInput.split('').filter((char, i) => char === text[i]).length;
      const newAccuracy = Math.round((correctChars / currentInput.length) * 100);
      
      setWpm(newWpm);
      setAccuracy(newAccuracy);
    }
  }, [startTime, currentInput, text]);

  const damageOpponent = useCallback(() => {
    const baseDamage = Math.round((playerStats.attack * (accuracy / 100)) * (wpm / 30));
    const comboDamage = baseDamage * (1 + (combo * 0.1));
    const finalDamage = Math.round(comboDamage);
    
    setLastDamage(finalDamage);
    setShowDamage(true);
    setTimeout(() => setShowDamage(false), 500);

    setOpponent(prev => ({
      ...prev,
      health: Math.max(0, prev.health - finalDamage)
    }));
  }, [playerStats.attack, accuracy, wpm, combo]);

  const gainExperience = useCallback(() => {
    const expGain = Math.round(wpm * (accuracy / 100) * (currentBoss ? 2 : 1));
    setPlayerStats(prev => {
      const newExp = prev.exp + expGain;
      if (newExp >= 100) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 2000);
        return {
          ...prev,
          level: prev.level + 1,
          exp: newExp - 100,
          attack: prev.attack + 3,
          defense: prev.defense + 2,
          maxHealth: prev.maxHealth + 20,
          health: prev.maxHealth + 20,
        };
      }
      return {
        ...prev,
        exp: newExp,
      };
    });
  }, [wpm, accuracy, currentBoss]);

  const checkForBossBattle = useCallback(() => {
    const availableBoss = BOSSES.find(boss => 
      boss.level === playerStats.level && !currentBoss
    );
    
    if (availableBoss) {
      setCurrentBoss(availableBoss);
      setOpponent({
        ...availableBoss,
        health: availableBoss.health,
        maxHealth: availableBoss.health,
      });
      setGameState('boss');
    }
  }, [playerStats.level, currentBoss]);

  useEffect(() => {
    if (gameState === 'playing' || gameState === 'boss') {
      calculateStats();
      if (currentInput.length > 0 && currentInput.length % 5 === 0) {
        damageOpponent();
      }
    }
  }, [currentInput, gameState, calculateStats, damageOpponent]);

  useEffect(() => {
    checkForBossBattle();
  }, [playerStats.level, checkForBossBattle]);

  const startGame = () => {
    const textArray = gameState === 'boss' ? textSnippets.boss : textSnippets.normal;
    setText(textArray[Math.floor(Math.random() * textArray.length)]);
    setStartTime(Date.now());
    setCurrentInput('');
    setWpm(0);
    setAccuracy(100);
    setMistakes(0);
    setCombo(0);
    
    if (!currentBoss) {
      setOpponent({
        name: "Practice Dummy",
        health: 100,
        maxHealth: 100,
        level: 1,
        image: "🎯"
      });
    }
  };

  const handleInput = (e) => {
    if (gameState !== 'playing' && gameState !== 'boss') return;

    const value = e.target.value;
    setCurrentInput(value);

    if (value !== text.slice(0, value.length)) {
      setMistakes(prev => prev + 1);
      setCombo(0);
    } else {
      setCombo(prev => prev + 1);
    }

    if (value === text) {
      gainExperience();
      if (gameState === 'boss' && opponent.health > 0) {
        startGame(); // Continue boss battle
      } else {
        setGameState('finished');
        if (currentBoss) {
          setCurrentBoss(null);
        }
      }
    }
  };

  const renderShop = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Shop</span>
            <span className="text-yellow-400">{gold} 🪙</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {Object.values(SHOP_ITEMS).map(item => (
              <div key={item.name} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="font-bold">{item.name}</div>
                    <div className="text-sm text-gray-600">{item.description}</div>
                  </div>
                </div>
                <button
                  onClick={() => purchaseItem(item)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  disabled={gold < item.price}
                >
                  {item.price} 🪙
                </button>
              </div>
            ))}
          </div>
          <div className="grid gap-4">
            {Object.values(POWER_UPS).map(powerUp => (
              <div key={powerUp.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{powerUp.icon}</span>
                  <div>
                    <div className="font-bold">{powerUp.name}</div>
                    <div className="text-sm text-gray-600">{powerUp.description}</div>
                  </div>
                </div>
                <button
                  onClick={() => purchaseItem(powerUp)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  disabled={gold < powerUp.price}
                >
                  {powerUp.price} 🪙
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowShop(false)}
            className="w-full mt-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close Shop
          </button>
        </CardContent>
      </Card>
    </div>
  );
  const addParticle = (type, x, y) => {
    const newParticle = {
      id: Math.random(),
      type,
      x,
      y,
      color: type === 'damage' ? 'text-red-500' : 'text-yellow-400',
      lifetime: 1000
    };
    setParticles(prev => [...prev, newParticle]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, newParticle.lifetime);
  };

  // Notification system
  const addNotification = (message, type = 'info') => {
    const newNotification = {
      id: Math.random(),
      message,
      type,
      timestamp: Date.now()
    };
    setNotifications(prev => [...prev, newNotification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 3000);
  };

  // Power-up system
  const usePowerUp = (powerUp) => {
    if (inventory.includes(powerUp.id)) {
      setInventory(prev => prev.filter(id => id !== powerUp.id));
      
      if (powerUp.id === 'heal') {
        setPlayerStats(prev => ({
          ...prev,
          health: Math.min(prev.health + 50, prev.maxHealth)
        }));
        addParticle('heal', 50, 50);
        addNotification('Healed 50 HP!', 'success');
      } else {
        setActiveEffects(prev => [...prev, {
          id: powerUp.id,
          endsAt: Date.now() + powerUp.duration
        }]);
        addNotification(`${powerUp.name} activated!`, 'success');
      }
    }
  };

  // Shop system
  const purchaseItem = (item) => {
    if (gold >= item.price) {
      setGold(prev => prev - item.price);
      if (item.stat) {
        setPlayerStats(prev => ({
          ...prev,
          [item.stat]: prev[item.stat] + item.boost
        }));
        addNotification(`Purchased ${item.name}!`, 'success');
      } else {
        setInventory(prev => [...prev, item.id]);
        addNotification(`${item.name} added to inventory!`, 'success');
      }
    } else {
      addNotification('Not enough gold!', 'error');
    }
  };

  // Enhanced damage calculation with power-ups
  const calculateDamage = useCallback(() => {
    let damage = playerStats.attack * (accuracy / 100) * (wpm / 30);
    
    // Apply active effects
    if (activeEffects.find(e => e.id === 'crit' && Math.random() < 0.25)) {
      damage *= 2;
      addParticle('critical', 50, 50);
    }
    if (activeEffects.find(e => e.id === 'speed')) {
      damage *= 1.5;
    }
    
    return Math.round(damage);
  }, [playerStats.attack, accuracy, wpm, activeEffects]);


  const renderInventory = () => (
    <div className="fixed bottom-4 left-4 flex gap-2">
      {inventory.map(itemId => {
        const powerUp = POWER_UPS[itemId.toUpperCase()];
        return (
          <button
            key={itemId}
            onClick={() => usePowerUp(powerUp)}
            className={`p-2 rounded-full ${powerUp.color} bg-opacity-20 hover:bg-opacity-30 transition-all`}
            title={powerUp.description}
          >
            <span className="text-2xl">{powerUp.icon}</span>
          </button>
        );
      })}
    </div>
  );
  const renderNotifications = () => (
    <div className="fixed top-4 right-4 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-2 rounded shadow-lg animate-slide-in
            ${notification.type === 'error' ? 'bg-red-500 text-white' : 
              notification.type === 'success' ? 'bg-green-500 text-white' :
              'bg-blue-500 text-white'}`}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );

  const renderHealthBar = (current, max, label) => (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span>{label}</span>
        <span>{current}/{max}</span>
      </div>
      <Progress 
        value={(current / max) * 100}
        className={`h-2 ${current < max * 0.3 ? 'bg-red-200' : 'bg-gray-200'}`}
      />
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <Card className="relative overflow-hidden">
        {showLevelUp && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 animate-fade-in">
            <div className="text-4xl text-yellow-400 font-bold animate-bounce">
              LEVEL UP! 🎉
            </div>
          </div>
        )}
        
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Monkey Type Pro - RPG Edition</span>
            <div className="flex items-center gap-2">
              <Star className="text-yellow-500" />
              <span>Level {playerStats.level}</span>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Battle Area */}
          <div className="grid grid-cols-2 gap-4">
            {/* Player */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sword className="w-4 h-4" /> Player
              </h3>
              {renderHealthBar(playerStats.health, playerStats.maxHealth, 'HP')}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>⚔️ Attack: {playerStats.attack}</div>
                <div>🛡️ Defense: {playerStats.defense}</div>
              </div>
              <Progress 
                value={playerStats.exp} 
                className="h-2"
                indicatorClassName="bg-blue-500"
              />
              <div className="text-sm text-center">EXP: {playerStats.exp}/100</div>
            </div>

            {/* Opponent */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Shield className="w-4 h-4" /> {opponent.name}
              </h3>
              <div className="text-center text-4xl mb-2">{opponent.image}</div>
              {renderHealthBar(opponent.health, opponent.maxHealth, 'HP')}
              {showDamage && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 font-bold text-2xl animate-damage">
                  -{lastDamage}
                </div>
              )}
            </div>
          </div>

{/* Shop button */}
<button
        onClick={() => setShowShop(true)}
        className="fixed bottom-4 right-4 p-3 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-all"
      >
        <ShoppingBag className="w-6 h-6" />
      </button>

      {/* Render systems */}
      {showShop && renderShop()}
      {renderInventory()}
      {renderNotifications()}

               {/* Particle effects */}
      <div className="fixed inset-0 pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className={`absolute ${particle.color} font-bold animate-float-up`}
            style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
          >
            {particle.type === 'damage' ? '-' + lastDamage : '+50 HP'}
          </div>
        ))}
      </div>
    </div>

          {/* Game Area */}
          <div className="space-y-4">
            {gameState === 'waiting' ? (
              <button
                onClick={() => {
                  setGameState('playing');
                  startGame();
                }}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Start Game
              </button>
            ) : (
              <>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-lg font-mono">
                    {text.split('').map((char, i) => {
                      let color = '';
                      if (i < currentInput.length) {
                        color = char === currentInput[i] ? 'text-green-500' : 'text-red-500';
                      }
                      return (
                        <span key={i} className={color}>
                          {char}
                        </span>
                      );
                    })}
                  </p>
                </div>
                <input
                  type="text"
                  value={currentInput}
                  onChange={handleInput}
                  className="w-full p-2 border rounded-lg font-mono"
                  placeholder="Start typing..."
                  autoFocus
                />
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <div className="text-sm text-gray-600">WPM</div>
              <div className="text-xl font-bold">{wpm}</div>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <div className="text-sm text-gray-600">Accuracy</div>
              <div className="text-xl font-bold">{accuracy}%</div>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <div className="text-sm text-gray-600">Combo</div>
              <div className="text-xl font-bold">x{combo}</div>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <div className="text-sm text-gray-600">Mistakes</div>
              <div className="text-xl font-bold">{mistakes}</div>
            </div>
          </div>

          {gameState === 'boss' && (
            <Alert className="bg-red-100">
              <Skull className="h-4 w-4" />
              <AlertDescription>
                BOSS BATTLE! Defeat {opponent.name} (Required WPM: {currentBoss.requiredWPM})
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonkeyTypePro;