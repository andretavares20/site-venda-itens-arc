-- Adiciona novos status ao enum TradeStatus para custódia admin nas trocas
ALTER TYPE "TradeStatus" ADD VALUE IF NOT EXISTS 'AGUARDANDO_RECOLHIMENTO';
ALTER TYPE "TradeStatus" ADD VALUE IF NOT EXISTS 'AGUARDANDO_ENTREGA';
