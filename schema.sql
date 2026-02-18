-- schema.sql
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 영문 원본
    title_en TEXT NOT NULL,
    summary_en TEXT,
    
    -- 한국어 번역
    title_ko TEXT,
    summary_ko TEXT,
    
    -- 메타데이터
    source TEXT NOT NULL,
    source_url TEXT,
    
    -- 분류 정보
    classify_method TEXT,
    confidence REAL,
    
    -- 타임스탬프
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 중복 방지
    article_hash TEXT UNIQUE
);

CREATE INDEX idx_published_at ON articles(published_at DESC);
CREATE INDEX idx_source ON articles(source);
CREATE INDEX idx_article_hash ON articles(article_hash);
