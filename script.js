// 在頁面載入完成後運行
document.addEventListener('DOMContentLoaded', function() {
    console.log("頁面已載入，測驗初始化中...");
    
    // 保存元素引用，避免重複獲取
    const DOM = {
        containers: {
            intro: document.getElementById('intro-container'),
            test: document.getElementById('test-container'),
            result: document.getElementById('result-container')
        },
        elements: {
            questionImageContainer: document.getElementById('question-image-container'),
            questionText: document.getElementById('question-text'),
            optionsContainer: document.getElementById('options-container'),
            progressFill: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text'),
            resultTitle: document.getElementById('result-title'),
            resultSubtitle: document.getElementById('result-subtitle'),
            resultDescription: document.getElementById('result-description'),
            traitsContainer: document.getElementById('traits-container'),
            similarBooks: document.getElementById('similar-books'),
            complementaryBooks: document.getElementById('complementary-books'),
            shareText: document.getElementById('share-text')
        },
        buttons: {
            start: document.getElementById('start-test'),
            copy: document.getElementById('copy-btn'),
            restart: document.getElementById('restart-btn')
        }
    };
    
    // 從 data.js 獲取測驗數據
    const questions = testData.questions;
    const results = testData.results;
    const traitNames = testData.traitNames;
    
    // 問題背景圖片 (與問題類型對應)
    const backgroundImages = {
        'A': 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2030', // 包裹修飾
        'B': 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?q=80&w=2029', // 沉默保留
        'C': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1998', // 重構視角
        'D': 'https://images.unsplash.com/photo-1533669955142-6a73332af4db?q=80&w=2074', // 假設探索
        'E': 'https://images.unsplash.com/photo-1513185041617-8ab03f83d6c5?q=80&w=2070', // 直接坦誠
        'default': 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=2070'
    };
    
    // 跟踪當前問題索引和用戶選擇
    let currentQuestionIndex = 0;
    const userAnswers = [];
    
    // 設置視口高度 - 確保移動設備上正確顯示100vh
    function setViewportHeight() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    // 在初始化和窗口大小調整時設置視口高度
    window.addEventListener('resize', setViewportHeight);
    setViewportHeight();
    
    // Fisher-Yates 洗牌算法 - 用於隨機打亂數組
    function shuffleArray(array) {
        const shuffled = [...array]; // 創建原數組的拷貝
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    // 改進的開始測驗 - 添加過渡動畫
    DOM.buttons.start.addEventListener('click', function() {
        console.log("開始測驗按鈕被點擊");
        
        // 先執行介紹頁面淡出效果
        DOM.containers.intro.style.opacity = '0';
        DOM.containers.intro.style.transform = 'translateY(-20px)';
        
        // 等待淡出完成後再切換頁面
        setTimeout(() => {
            // 移除介紹頁面
            DOM.containers.intro.classList.remove('active');
            
            // 準備測驗頁面但保持透明
            DOM.containers.test.classList.add('active');
            DOM.containers.test.style.opacity = '0';
            DOM.containers.test.style.transform = 'translateY(20px)';
            
            // 強制重排以確保過渡效果
            DOM.containers.test.offsetHeight;
            
            // 設置進度條初始狀態
            DOM.elements.progressFill.style.width = '0%';
            DOM.elements.progressText.textContent = `問題 1/${questions.length}`;
            
            // 預加載第一個問題的背景圖片
            const firstQuestion = questions[0];
            const dominantType = getDominantType(firstQuestion.options);
            const firstBackgroundImage = backgroundImages[dominantType] || backgroundImages.default;
            
            const preloadImage = new Image();
            preloadImage.src = firstBackgroundImage;
            
            preloadImage.onload = function() {
                // 圖片加載完成後，設置背景並淡入
                DOM.elements.questionImageContainer.style.backgroundImage = `url('${firstBackgroundImage}')`;
                
                // 觸發測驗頁面淡入動畫
                DOM.containers.test.style.opacity = '1';
                DOM.containers.test.style.transform = 'translateY(0)';
                
                // 等待頁面淡入後再渲染問題
                setTimeout(() => {
                    renderQuestion();
                }, 300);
            };
            
            // 如果圖片加載時間過長，也要繼續進行
            setTimeout(() => {
                if (DOM.containers.test.style.opacity !== '1') {
                    DOM.containers.test.style.opacity = '1';
                    DOM.containers.test.style.transform = 'translateY(0)';
                    renderQuestion();
                }
            }, 1000);
        }, 300);
    });
    
    // 改進的重新開始測驗
    DOM.buttons.restart.addEventListener('click', () => {
        // 重置測驗狀態
        currentQuestionIndex = 0;
        userAnswers.length = 0;
        
        // 執行結果頁面淡出
        DOM.containers.result.style.opacity = '0';
        
        // 等待淡出完成後切換頁面
        setTimeout(() => {
            DOM.containers.result.classList.remove('active');
            DOM.containers.intro.style.opacity = '0';
            DOM.containers.intro.classList.add('active');
            
            // 強制重排以確保過渡效果
            DOM.containers.intro.offsetHeight;
            
            // 執行介紹頁面淡入
            DOM.containers.intro.style.opacity = '1';
            
            // 重置DOM元素
            DOM.elements.progressFill.style.width = '0%';
            
            // 滾動到頂部
            window.scrollTo(0, 0);
        }, 300);
    });
    
    // 渲染當前問題
    function renderQuestion() {
        const question = questions[currentQuestionIndex];
        
        // 設置問題文本
        DOM.elements.questionText.textContent = question.question;
        
        // 設置背景圖片 (根據問題類型選擇圖片)
        const dominantType = getDominantType(question.options);
        const backgroundImage = backgroundImages[dominantType] || backgroundImages.default;
        
        // 使用淡入淡出效果更換背景圖片
        DOM.elements.questionImageContainer.style.opacity = '0.7';
        setTimeout(() => {
            DOM.elements.questionImageContainer.style.backgroundImage = `url('${backgroundImage}')`;
            DOM.elements.questionImageContainer.style.opacity = '1';
        }, 300);
        
        // 創建選項的拷貝並標記原始索引
        const optionsWithIndex = question.options.map((option, originalIndex) => {
            return {
                ...option,
                originalIndex // 保存原始索引，以便正確記錄選擇
            };
        });
        
        // 打亂選項順序
        const shuffledOptions = shuffleArray(optionsWithIndex);
        
        // 渲染選項 - 使用淡入效果，不顯示ABCDE標記
        DOM.elements.optionsContainer.style.opacity = '0.7';
        setTimeout(() => {
            let optionsHTML = '';
            shuffledOptions.forEach((option, index) => {
                const originalIndex = option.originalIndex;
                const isSelected = userAnswers[currentQuestionIndex] === originalIndex;
                optionsHTML += `
                <div class="option ${isSelected ? 'selected' : ''}" data-index="${originalIndex}" style="animation-delay: ${index * 0.1}s">
                    ${option.text}
                </div>`;
            });
            DOM.elements.optionsContainer.innerHTML = optionsHTML;
            DOM.elements.optionsContainer.style.opacity = '1';
            
            // 為選項添加事件監聽器
            document.querySelectorAll('.option').forEach(option => {
                option.addEventListener('click', handleOptionClick);
            });
        }, 300);
        
        updateProgressBar();
    }
    
    // 獲取問題選項中的主導類型
    function getDominantType(options) {
        const typeCounts = {};
        
        // 計算每種類型的數量
        options.forEach(option => {
            const type = option.primary; 
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        // 找出出現最多的類型
        let maxCount = 0;
        let dominantType = 'default';
        
        for (const type in typeCounts) {
            if (typeCounts[type] > maxCount) {
                maxCount = typeCounts[type];
                dominantType = type;
            }
        }
        
        return dominantType;
    }
    
    // 處理選項點擊
    function handleOptionClick(e) {
        // 確保點擊的是選項元素本身，而不是子元素
        const targetElement = e.target.closest('.option');
        if (!targetElement) return;
        
        // 防止連續點擊
        document.querySelectorAll('.option').forEach(option => {
            option.removeEventListener('click', handleOptionClick);
        });
        
        const optionIndex = parseInt(targetElement.dataset.index);
        userAnswers[currentQuestionIndex] = optionIndex;
        
        console.log(`問題 ${currentQuestionIndex+1} 選擇了選項 ${optionIndex+1}, 主要類型: ${questions[currentQuestionIndex].options[optionIndex].primary}`);
        
        // 更新選項樣式
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        targetElement.classList.add('selected');
        
        // 添加延遲，讓用戶能看到選中效果
        setTimeout(() => {
            // 判斷是否為最後一題
            if (currentQuestionIndex < questions.length - 1) {
                // 如果不是最後一題，自動前進到下一題
                currentQuestionIndex++;
                renderQuestion();
            } else {
                // 如果是最後一題，則顯示結果
                console.log("已完成所有問題，準備顯示結果");
                
                // 使用淡出效果
                DOM.containers.test.style.opacity = '0';
                setTimeout(() => {
                    DOM.containers.test.classList.remove('active');
                    try {
                        showResult();
                    } catch (error) {
                        console.error("顯示結果時發生錯誤:", error);
                        alert("顯示結果時出錯，請重新嘗試測驗");
                    }
                }, 500);
            }
        }, 300); // 延遲300毫秒
    }
    
    // 更新進度條
    function updateProgressBar() {
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
        DOM.elements.progressFill.style.width = `${progress}%`;
        DOM.elements.progressText.textContent = `問題 ${currentQuestionIndex + 1}/${questions.length}`;
    }
    
    // 計算結果函數 - 使用多特質比例計分邏輯
    function calculateResult() {
        try {
            // 初始化各類型的得分
            const typeScores = {
                'A': 0, // 包裹修飾
                'B': 0, // 沉默保留
                'C': 0, // 重構視角
                'D': 0, // 假設探索
                'E': 0  // 直接坦誠
            };
            
            console.log("計算結果 - 用戶選擇:", userAnswers);
            
            // 計算每種類型的得分 - 多特質比例計分
            userAnswers.forEach((answerIndex, questionIndex) => {
                if (answerIndex !== undefined && questionIndex < questions.length) {
                    const question = questions[questionIndex];
                    if (question && question.options && question.options[answerIndex]) {
                        const selectedOption = question.options[answerIndex];
                        
                        // 獲取該選項的得分分配
                        const scores = selectedOption.scores;
                        
                        // 將得分分配加入總分中
                        for (const type in scores) {
                            if (typeScores.hasOwnProperty(type)) {
                                typeScores[type] += scores[type];
                                console.log(`問題 ${questionIndex+1}: ${type} 類型得分 +${scores[type]}`);
                            }
                        }
                    }
                }
            });
            
            // 將得分保存，以便在結果頁面顯示
            window.finalTypeScores = typeScores;
            
            // 檢查是否有四種類型得分相同
            const scoreFrequency = {};
            for (const type in typeScores) {
                // 四捨五入到小數點後一位，避免浮點數比較問題
                const score = Math.round(typeScores[type] * 10) / 10;
                scoreFrequency[score] = (scoreFrequency[score] || 0) + 1;
            }
            
            for (const score in scoreFrequency) {
                if (scoreFrequency[score] === 4) {
                    return results["SPECIAL"];
                }
            }
            
            // 尋找得分最高的類型
            let maxScore = 0;
            let highestTypes = [];
            
            for (const type in typeScores) {
                if (typeScores[type] > maxScore) {
                    maxScore = typeScores[type];
                    highestTypes = [type];
                } else if (Math.abs(typeScores[type] - maxScore) < 0.1) { // 考慮浮點數誤差，差異小於0.1視為相同
                    highestTypes.push(type);
                }
            }
            
            // 如果有三個或更多類型得分相同且為最高分，返回特殊結果
            if (highestTypes.length >= 3) {
                return results["SPECIAL"];
            }
            
            // 如果只有一個最高分類型，直接返回結果
            if (highestTypes.length === 1) {
                return results[highestTypes[0]];
            }
            
            // 如果有兩個類型同分且為最高分，使用決勝題機制 (第11題，索引為10)
            if (highestTypes.length === 2) {
                const tiebreakQuestionIndex = 10; // 第11題的索引是10 (修改為使用第11題作為決勝題)
                const tiebreakAnswer = userAnswers[tiebreakQuestionIndex];
                
                if (tiebreakAnswer !== undefined) {
                    const tiebreakPrimaryType = questions[tiebreakQuestionIndex].options[tiebreakAnswer].primary;
                    
                    // 檢查決勝題的主要類型是否在最高分類型中
                    if (highestTypes.includes(tiebreakPrimaryType)) {
                        return results[tiebreakPrimaryType];
                    }
                }
                
                // 如果決勝題不能決勝，使用各類型分佈的差異性作為決勝依據
                const balanceScores = {};
                highestTypes.forEach(type => {
                    let diffSum = 0;
                    Object.keys(typeScores).forEach(otherType => {
                        if (type !== otherType) {
                            diffSum += Math.abs(typeScores[type] - typeScores[otherType]);
                        }
                    });
                    balanceScores[type] = diffSum;
                });
                
                // 選擇特質分佈最均衡的類型
                const minBalanceScore = Math.min(...Object.values(balanceScores));
                const balanceWinners = highestTypes.filter(
                    type => balanceScores[type] === minBalanceScore
                );
                
                return results[balanceWinners[0]];
            }
            
            // 保險處理：如果上述所有邏輯都未返回結果，選擇第一個最高分類型
            return results[highestTypes[0]];
        } catch (error) {
            console.error("計算結果時發生錯誤:", error);
            return results['A']; // 發生錯誤時返回默認結果
        }
    }
    
    // 顯示結果
    function showResult() {
        try {
            // 預先設置結果容器為透明狀態以準備淡入
            DOM.containers.result.style.opacity = '0';
            DOM.containers.result.classList.add('active');
            
            const result = calculateResult();
            
            // 設置結果標題和副標題
            if (result.title.includes('溝通協調師')) {
                DOM.elements.resultTitle.textContent = `你是：${result.title}`;
            } else {
                DOM.elements.resultTitle.textContent = `你的溝通類型是：${result.title}`;
            }
            
            DOM.elements.resultSubtitle.textContent = result.subtitle || '';
            DOM.elements.resultDescription.textContent = result.description || '';
            
            // 設置特質
            DOM.elements.traitsContainer.innerHTML = '';
            const typeScores = window.finalTypeScores || {
                'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0
            };
            
            // 特殊處理《溝通協調師》的特質顯示
            if (result.title.includes('溝通協調師')) {
                Object.keys(traitNames).forEach(type => {
                    addTraitElement(type, 3);
                });
            } else {
                // 為每種特質創建評分顯示
                Object.keys(traitNames).forEach(type => {
                    // 獲取原始分數
                    const score = typeScores[type] || 0;
                    
                    // 根據得分計算星星數 (0-11分映射到1-5星)
                    // 考慮到新的計分方式會有小數，調整映射規則
                    let normalizedScore;
                    if (score < 1) {
                        normalizedScore = 1; 
                    } else if (score >= 1 && score < 3) {
                        normalizedScore = 2; 
                    } else if (score >= 3 && score < 5) {
                        normalizedScore = 3; 
                    } else if (score >= 5 && score < 7) {
                        normalizedScore = 4; 
                    } else {
                        normalizedScore = 5; 
                    }
                    
                    addTraitElement(type, normalizedScore);
                });
            }
            
            // 設置相似和互補溝通風格
            if (result.similar && Array.isArray(result.similar)) {
                DOM.elements.similarBooks.innerHTML = result.similar.map(book => `<p>${book}</p>`).join('');
            } else {
                DOM.elements.similarBooks.innerHTML = '<p>無相似溝通風格資料</p>';
            }
            
            if (result.complementary && Array.isArray(result.complementary)) {
                DOM.elements.complementaryBooks.innerHTML = result.complementary.map(book => `<p>${book}</p>`).join('');
            } else {
                DOM.elements.complementaryBooks.innerHTML = '<p>無互補溝通風格資料</p>';
            }
            
            // 設置分享文字
            DOM.elements.shareText.textContent = result.shareText || '';
            
            // 強制重排以確保過渡效果
            DOM.containers.result.offsetHeight;
            
            // 執行結果頁面淡入
            DOM.containers.result.style.opacity = '1';
            
            // 確保結果容器可滾動
            document.body.style.overflow = 'auto';
            
            // 滾動到頂部
            window.scrollTo(0, 0);
        } catch (error) {
            console.error("顯示結果時發生錯誤:", error);
            alert("顯示結果時出錯，請重新嘗試測驗");
        }
    }
    
    // 添加特質元素助手函數
    function addTraitElement(type, starCount) {
        const traitElement = document.createElement('div');
        traitElement.className = 'trait-item';
        
        const traitName = document.createElement('span');
        traitName.className = 'trait-name';
        traitName.textContent = traitNames[type];
        
        const traitStars = document.createElement('span');
        traitStars.className = 'trait-stars';
        traitStars.textContent = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
        
        traitElement.appendChild(traitName);
        traitElement.appendChild(traitStars);
        DOM.elements.traitsContainer.appendChild(traitElement);
    }
    
    // 複製分享文字
    DOM.buttons.copy.addEventListener('click', () => {
        const shareText = DOM.elements.shareText.textContent;
        navigator.clipboard.writeText(shareText).then(() => {
            DOM.buttons.copy.textContent = '已複製!';
            setTimeout(() => {
                DOM.buttons.copy.textContent = '複製';
            }, 2000);
        }).catch(err => {
            console.error('無法複製: ', err);
        });
    });
});