import sqlite3, os, json
from datetime import datetime

_DEFAULT_DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "abf.db")
DB_PATH = os.environ.get("DATABASE_URL", _DEFAULT_DB)

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_conn()
    c = conn.cursor()

    c.executescript("""
    CREATE TABLE IF NOT EXISTS relatorios (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        periodo     TEXT NOT NULL UNIQUE,   -- '1T2025'
        ano         INTEGER NOT NULL,
        trimestre   INTEGER,               -- 1-4, NULL = anual
        tipo        TEXT DEFAULT 'trimestral', -- trimestral | anual | especial
        arquivo     TEXT,
        status      TEXT DEFAULT 'importado', -- importado | revisado | publicado
        notas       TEXT,
        created_at  TEXT DEFAULT (datetime('now')),
        updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS faturamento (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        relatorio_id INTEGER REFERENCES relatorios(id),
        periodo     TEXT NOT NULL,
        segmento    TEXT NOT NULL,
        valor_mm    REAL NOT NULL,      -- R$ milhões
        tipo_dado   TEXT DEFAULT 'trimestral', -- trimestral | anual | 12m_acumulado
        created_at  TEXT DEFAULT (datetime('now')),
        UNIQUE(periodo, segmento, tipo_dado)
    );

    CREATE TABLE IF NOT EXISTS indicadores (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        relatorio_id    INTEGER REFERENCES relatorios(id),
        periodo         TEXT NOT NULL UNIQUE,
        empregos_diretos INTEGER,
        num_redes       INTEGER,
        num_unidades    INTEGER,
        ticket_medio    REAL,
        var_empregos_pct REAL,
        var_redes_pct   REAL,
        var_unidades_pct REAL,
        empregos_por_unidade INTEGER,
        created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ranking (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        relatorio_id INTEGER REFERENCES relatorios(id),
        ano         INTEGER NOT NULL,
        posicao     INTEGER NOT NULL,
        posicao_ant INTEGER,
        marca       TEXT NOT NULL,
        segmento    TEXT,
        unidades    INTEGER,
        unidades_ant INTEGER,
        var_pct     REAL,
        created_at  TEXT DEFAULT (datetime('now')),
        UNIQUE(ano, posicao)
    );

    CREATE TABLE IF NOT EXISTS projecoes (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        relatorio_id    INTEGER REFERENCES relatorios(id),
        ano_referencia  INTEGER NOT NULL UNIQUE,
        fat_var_min_pct REAL,
        fat_var_max_pct REAL,
        fat_realizado_pct REAL,
        redes_var_pct   REAL,
        unidades_var_pct REAL,
        empregos_var_pct REAL,
        created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS macro_bcb (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        data        TEXT NOT NULL,
        codigo_serie INTEGER NOT NULL,
        nome_serie  TEXT NOT NULL,
        valor       REAL NOT NULL,
        fonte       TEXT DEFAULT 'BCB',
        created_at  TEXT DEFAULT (datetime('now')),
        UNIQUE(data, codigo_serie)
    );

    CREATE TABLE IF NOT EXISTS macro_ibge (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        data            TEXT NOT NULL,
        codigo_agregado INTEGER NOT NULL,
        variavel        TEXT NOT NULL,
        localidade      TEXT NOT NULL,
        valor           REAL,
        fonte           TEXT DEFAULT 'IBGE',
        created_at      TEXT DEFAULT (datetime('now')),
        UNIQUE(data, codigo_agregado, variavel, localidade)
    );

    CREATE TABLE IF NOT EXISTS sync_log (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        fonte               TEXT NOT NULL,
        status              TEXT NOT NULL,
        registros_inseridos INTEGER DEFAULT 0,
        erro                TEXT,
        created_at          TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pmc_ibge (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        data             TEXT NOT NULL,
        codigo_segmento  TEXT NOT NULL,
        nome_segmento    TEXT NOT NULL,
        variacao_mensal  REAL,
        variacao_anual   REAL,
        indice           REAL,
        fonte            TEXT DEFAULT 'IBGE/PMC',
        url_fonte        TEXT DEFAULT 'https://servicodados.ibge.gov.br/api/v3/agregados/8882',
        data_coleta      TEXT,
        created_at       TEXT DEFAULT (datetime('now')),
        UNIQUE(data, codigo_segmento)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        acao        TEXT NOT NULL,           -- INSERT | UPDATE | DELETE
        usuario     TEXT DEFAULT 'admin',
        tabela      TEXT NOT NULL,
        registro_id INTEGER,
        dados_json  TEXT,
        created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS franquias (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        nome            TEXT NOT NULL UNIQUE,
        slug            TEXT NOT NULL,
        segmento        TEXT,
        investimento_min REAL,
        investimento_max REAL,
        num_unidades    INTEGER,
        logo_url        TEXT,
        site_oficial    TEXT,
        descricao       TEXT,
        descricao_longa TEXT,
        selo_abf        BOOLEAN DEFAULT 0,
        taxa_franquia   REAL,
        royalties_pct   REAL,
        tempo_retorno_meses INTEGER,
        num_estados     INTEGER,
        ano_fundacao    INTEGER,
        imagem_og       TEXT,
        fonte           TEXT DEFAULT 'ABF/PortalFranchising',
        url_fonte       TEXT,
        data_coleta     TEXT,
        created_at      TEXT DEFAULT (datetime('now')),
        updated_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS caged_bcb (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        data        TEXT NOT NULL,
        estoque     REAL,
        saldo       REAL,
        setor       TEXT NOT NULL,
        codigo_bcb  INTEGER NOT NULL,
        fonte       TEXT DEFAULT 'MTE/CAGED via BCB',
        url_fonte   TEXT,
        data_coleta TEXT,
        created_at  TEXT DEFAULT (datetime('now')),
        UNIQUE(data, codigo_bcb)
    );

    CREATE TABLE IF NOT EXISTS noticias_raw (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo          TEXT NOT NULL,
        url             TEXT UNIQUE NOT NULL,
        conteudo_bruto  TEXT,
        resumo_bruto    TEXT,
        fonte           TEXT NOT NULL,
        url_fonte       TEXT,
        idioma          TEXT DEFAULT 'pt',
        data_publicacao TEXT,
        data_coleta     TEXT DEFAULT (datetime('now')),
        processado      INTEGER DEFAULT 0,
        created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS noticias_fila (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        raw_id          INTEGER REFERENCES noticias_raw(id),
        titulo_gerado   TEXT,
        conteudo_gerado TEXT,
        resumo          TEXT,
        meta_description TEXT,
        palavra_chave   TEXT,
        imagem_prompt   TEXT,
        segmento        TEXT,
        tags            TEXT,
        relevancia      INTEGER DEFAULT 5,
        status          TEXT DEFAULT 'pendente',
        status_editorial TEXT DEFAULT 'rascunho',
        titulos_sugeridos TEXT,
        titulo_escolhido TEXT,
        instrucao_refazer TEXT,
        versao          INTEGER DEFAULT 1,
        criado_por      TEXT DEFAULT 'ia',
        created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts_instagram (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        noticia_id      INTEGER REFERENCES noticias_fila(id),
        tipo            TEXT NOT NULL,
        legenda         TEXT NOT NULL,
        hashtags        TEXT,
        dado_destaque   TEXT,
        subtexto        TEXT,
        card_html       TEXT,
        imagem_url      TEXT,
        status          TEXT DEFAULT 'rascunho',
        instagram_post_id TEXT,
        created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS carrosseis_instagram (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo            TEXT NOT NULL,
        titulo          TEXT NOT NULL,
        slides_json     TEXT NOT NULL,
        hashtags        TEXT,
        design          TEXT DEFAULT 'escuro',
        status          TEXT DEFAULT 'rascunho',
        created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS noticias_publicadas (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        fila_id         INTEGER REFERENCES noticias_fila(id),
        titulo          TEXT NOT NULL,
        conteudo        TEXT NOT NULL,
        resumo          TEXT,
        slug            TEXT UNIQUE,
        segmento        TEXT,
        tags            TEXT,
        imagem_url      TEXT,
        autor           TEXT DEFAULT 'Redação Mercado Franquia',
        publicado_em    TEXT DEFAULT (datetime('now')),
        views           INTEGER DEFAULT 0,
        created_at      TEXT DEFAULT (datetime('now'))
    );
    """)
    conn.commit()
    conn.close()
    print("Banco criado.")

def seed_historico():
    """Popula banco com todos os dados históricos extraídos dos PDFs."""
    conn = get_conn()
    c = conn.cursor()

    # ── RELATÓRIOS ──────────────────────────────────────────────────────
    relatorios = [
        ("1T2018",2018,1),("2T2018",2018,2),("3T2018",2018,3),("4T2018",2018,4),
        ("1T2019",2019,1),("2T2019",2019,2),("3T2019",2019,3),("4T2019",2019,4),
        ("2T2020",2020,2),("3T2020",2020,3),("4T2020",2020,4),
        ("1T2021",2021,1),("2T2021",2021,2),("3T2021",2021,3),("4T2021",2021,4),
        ("1T2022",2022,1),("2T2022",2022,2),("3T2022",2022,3),("4T2022",2022,4),
        ("3T2023",2023,3),("4T2023",2023,4),
        ("1T2024",2024,1),("2T2024",2024,2),("3T2024",2024,3),("4T2024",2024,4),
        ("1T2025",2025,1),("3T2025",2025,3),("4T2025",2025,4),
    ]
    for p, a, t in relatorios:
        c.execute("INSERT OR IGNORE INTO relatorios(periodo,ano,trimestre,status) VALUES(?,?,?,'revisado')",
                  (p, a, t))

    # ── FATURAMENTO ANUAL (tipo_dado='anual') ────────────────────────────
    fat_anual = [
        (2014, "Total", 127000),
        (2015, "Total", 139593),
        (2016, "Total", 151247),
        (2017, "Total", 163319),
        (2018, "Total", 174843),
        (2019, "Total", 186755),
        (2020, "Total", 167187),
        (2021, "Total", 185068),
        (2022, "Total", 211488),
        (2023, "Total", 240662),
        (2024, "Total", 264727),
    ]
    for ano, seg, val in fat_anual:
        c.execute("INSERT OR IGNORE INTO faturamento(periodo,segmento,valor_mm,tipo_dado) VALUES(?,?,?,'anual')",
                  (str(ano), seg, val))

    # ── FATURAMENTO POR SEGMENTO – anual 2018 ───────────────────────────
    seg_2018 = [
        ("Alimentação","4T2018",45827),("Casa e Construção","4T2018",10020),
        ("Comunicação/TI","4T2018",5485),("Entretenimento e Lazer","4T2018",2437),
        ("Hotelaria e Turismo","4T2018",12632),("Limpeza e Conservação","4T2018",1386),
        ("Moda","4T2018",22931),("Saúde, Beleza e Bem-Estar","4T2018",31907),
        ("Serviços Automotivos","4T2018",5894),("Serviços e Outros Negócios","4T2018",24924),
        ("Educação","4T2018",11400),
    ]
    for seg, per, val in seg_2018:
        c.execute("INSERT OR IGNORE INTO faturamento(periodo,segmento,valor_mm,tipo_dado) VALUES(?,?,?,'anual')",
                  (per, seg, val))

    # ── FATURAMENTO POR SEGMENTO – anual 2019 ───────────────────────────
    seg_2019 = [
        ("Alimentação","4T2019",48399),("Casa e Construção","4T2019",11019),
        ("Comunicação/TI","4T2019",6034),("Entretenimento e Lazer","4T2019",2568),
        ("Hotelaria e Turismo","4T2019",13286),("Limpeza e Conservação","4T2019",1451),
        ("Moda","4T2019",24228),("Saúde, Beleza e Bem-Estar","4T2019",34214),
        ("Serviços Automotivos","4T2019",6316),("Serviços e Outros Negócios","4T2019",27001),
        ("Educação","4T2019",12239),
    ]
    for seg, per, val in seg_2019:
        c.execute("INSERT OR IGNORE INTO faturamento(periodo,segmento,valor_mm,tipo_dado) VALUES(?,?,?,'anual')",
                  (per, seg, val))

    # ── FATURAMENTO POR SEGMENTO – anual 2020 ───────────────────────────
    seg_2020 = [
        ("Alimentação - CD","4T2020",9740),("Alimentação - FS","4T2020",31158),
        ("Casa e Construção","4T2020",12429),("Comunicação/TI","4T2020",6063),
        ("Entretenimento e Lazer","4T2020",1823),("Hotelaria e Turismo","4T2020",6673),
        ("Limpeza e Conservação","4T2020",1317),("Moda","4T2020",19153),
        ("Saúde, Beleza e Bem-Estar","4T2020",35276),("Serviços Automotivos","4T2020",5973),
        ("Serviços e Outros Negócios","4T2020",26648),("Educação","4T2020",10934),
    ]
    for seg, per, val in seg_2020:
        c.execute("INSERT OR IGNORE INTO faturamento(periodo,segmento,valor_mm,tipo_dado) VALUES(?,?,?,'anual')",
                  (per, seg, val))

    # ── FATURAMENTO POR SEGMENTO – anual 2021 ───────────────────────────
    seg_2021 = [
        ("Alimentação - CD","4T2021",10959),("Alimentação - FS","4T2021",32776),
        ("Casa e Construção","4T2021",14830),("Comunicação/TI","4T2021",6218),
        ("Entretenimento e Lazer","4T2021",2209),("Hotelaria e Turismo","4T2021",7938),
        ("Limpeza e Conservação","4T2021",1511),("Moda","4T2021",22070),
        ("Saúde, Beleza e Bem-Estar","4T2021",38976),("Serviços Automotivos","4T2021",6505),
        ("Serviços e Outros Negócios","4T2021",29597),("Educação","4T2021",11479),
    ]
    for seg, per, val in seg_2021:
        c.execute("INSERT OR IGNORE INTO faturamento(periodo,segmento,valor_mm,tipo_dado) VALUES(?,?,?,'anual')",
                  (per, seg, val))

    # ── FATURAMENTO POR SEGMENTO – anual 2022 ───────────────────────────
    seg_2022 = [
        ("Alimentação - CD","4T2022",12098),("Alimentação - FS","4T2022",39821),
        ("Casa e Construção","4T2022",15932),("Comunicação/TI","4T2022",6752),
        ("Entretenimento e Lazer","4T2022",2472),("Hotelaria e Turismo","4T2022",9885),
        ("Limpeza e Conservação","4T2022",1694),("Moda","4T2022",23629),
        ("Saúde, Beleza e Bem-Estar","4T2022",47362),("Serviços Automotivos","4T2022",6837),
        ("Serviços e Outros Negócios","4T2022",32015),("Educação","4T2022",12991),
    ]
    for seg, per, val in seg_2022:
        c.execute("INSERT OR IGNORE INTO faturamento(periodo,segmento,valor_mm,tipo_dado) VALUES(?,?,?,'anual')",
                  (per, seg, val))

    # ── FATURAMENTO POR SEGMENTO – anual 2023 ───────────────────────────
    seg_2023 = [
        ("Alimentação - CD","4T2023",23643),("Alimentação - FS","4T2023",42398),
        ("Casa e Construção","4T2023",18098),("Comunicação/TI","4T2023",7715),
        ("Entretenimento e Lazer","4T2023",2906),("Hotelaria e Turismo","4T2023",11782),
        ("Limpeza e Conservação","4T2023",1983),("Moda","4T2023",26808),
        ("Saúde, Beleza e Bem-Estar","4T2023",57470),("Serviços Automotivos","4T2023",7888),
        ("Serviços e Outros Negócios","4T2023",35093),("Educação","4T2023",14584),
    ]
    for seg, per, val in seg_2023:
        c.execute("INSERT OR IGNORE INTO faturamento(periodo,segmento,valor_mm,tipo_dado) VALUES(?,?,?,'anual')",
                  (per, seg, val))

    # ── FATURAMENTO 12M – 1T2025 ─────────────────────────────────────────
    seg_1t2025_12m = [
        ("Alimentação - CD","1T2025",24118),("Alimentação - FS","1T2025",48167),
        ("Casa e Construção","1T2025",20034),("Comunicação/TI","1T2025",8469),
        ("Entretenimento e Lazer","1T2025",3337),("Hotelaria e Turismo","1T2025",13228),
        ("Limpeza e Conservação","1T2025",2229),("Moda","1T2025",29339),
        ("Saúde, Beleza e Bem-Estar","1T2025",66939),("Serviços Automotivos","1T2025",8748),
        ("Serviços e Outros Negócios","1T2025",38166),("Educação","1T2025",15717),
    ]
    for seg, per, val in seg_1t2025_12m:
        c.execute("INSERT OR IGNORE INTO faturamento(periodo,segmento,valor_mm,tipo_dado) VALUES(?,?,?,'12m_acumulado')",
                  (per, seg, val))

    # ── FATURAMENTO 12M – 3T2025 ─────────────────────────────────────────
    seg_3t2025_12m = [
        ("Alimentação - CD","3T2025",27208),("Alimentação - FS","3T2025",50471),
        ("Casa e Construção","3T2025",20689),("Comunicação/TI","3T2025",8820),
        ("Entretenimento e Lazer","3T2025",3529),("Hotelaria e Turismo","3T2025",13818),
        ("Limpeza e Conservação","3T2025",2384),("Moda","3T2025",30562),
        ("Saúde, Beleza e Bem-Estar","3T2025",71080),("Serviços Automotivos","3T2025",9167),
        ("Serviços e Outros Negócios","3T2025",39839),("Educação","3T2025",15969),
    ]
    for seg, per, val in seg_3t2025_12m:
        c.execute("INSERT OR IGNORE INTO faturamento(periodo,segmento,valor_mm,tipo_dado) VALUES(?,?,?,'12m_acumulado')",
                  (per, seg, val))

    # ── FATURAMENTO TRIMESTRAL ────────────────────────────────────────────
    fat_trim = [
        ("1T2018","Total",37100),("2T2018","Total",42500),
        ("3T2018","Total",43200),("4T2018","Total",52043),
        ("1T2019","Total",39500),("2T2019","Total",44000),
        ("3T2019","Total",48500),("4T2019","Total",54755),
        ("2T2020","Total",38900),("3T2020","Total",41500),("4T2020","Total",53976),
        ("1T2021","Total",41900),("2T2021","Total",47200),
        ("3T2021","Total",51300),("4T2021","Total",56663),
        ("1T2022","Total",47500),("2T2022","Total",52800),
        ("3T2022","Total",57200),("4T2022","Total",63700),
        ("3T2023","Total",62000),("4T2023","Total",65500),
        ("1T2024","Total",60560),("2T2024","Total",65500),
        ("3T2024","Total",70231),("4T2024","Total",68436),
        ("1T2025","Total",65970),("3T2025","Total",76607),
    ]
    for per, seg, val in fat_trim:
        c.execute("INSERT OR IGNORE INTO faturamento(periodo,segmento,valor_mm,tipo_dado) VALUES(?,?,?,'trimestral')",
                  (per, seg, val))

    # ── INDICADORES ──────────────────────────────────────────────────────
    indicadores = [
        ("4T2018", 1299145, None, None, None, 8.8),
        ("4T2019", 1348235, None, None, None, 8.0),
        ("4T2020", 1314000, None, None, -2.6, 8.0),
        ("4T2021", 1389000, None, None, 5.7, 8.0),
        ("1T2022", 1417529, None, None, None, None),
        ("2T2022", 1450000, None, None, None, None),
        ("3T2022", 1580000, None, None, None, 9.0),
        ("4T2022", 1580000, None, None, 13.8, 9.0),
        ("3T2023", 1645000, None, None, 4.1, 9.0),
        ("1T2024", 1658000, None, None, None, 9.0),
        ("4T2024", 1795320, None, None, 9.1, 9.0),
        ("1T2025", None,    None, None, None, None),
        ("3T2025", None,    None, None, None, None),
        ("4T2025", None,    None, None, None, 9.0),
    ]
    for row in indicadores:
        per, emp, redes, unid, var_emp, emp_unid = row
        c.execute("""INSERT OR IGNORE INTO indicadores
            (periodo, empregos_diretos, num_redes, num_unidades, var_empregos_pct, empregos_por_unidade)
            VALUES(?,?,?,?,?,?)""", (per, emp, redes, unid, var_emp, emp_unid))

    # ── PROJEÇÕES vs REALIZADO ────────────────────────────────────────────
    projecoes = [
        (2021, 8.0,  8.0,  10.7),
        (2022, 9.0,  12.0, 14.3),
        (2023, 9.5,  12.0, 13.8),
        (2024, 10.0, 10.0, 10.0),
        (2025, 2.0,  2.0,  10.5),   # 10.5 = YTD 3T2025
    ]
    for row in projecoes:
        ano, mn, mx, real = row
        c.execute("""INSERT OR IGNORE INTO projecoes
            (ano_referencia, fat_var_min_pct, fat_var_max_pct, fat_realizado_pct)
            VALUES(?,?,?,?)""", (ano, mn, mx, real))

    # ── RANKING 2018 ─────────────────────────────────────────────────────
    ranking_2018 = [
        (1,1,"O Boticário","Saúde, Beleza e Bem-Estar",3724,3762),
        (2,2,"AM/PM","Alimentação",2493,2415),
        (3,4,"McDonald's","Alimentação",2289,2009),
        (4,3,"Cacau Show","Alimentação",2232,2081),
        (5,None,"Subway","Alimentação",2094,None),
        (6,5,"Jet Oil","Serviços Automotivos",1772,1735),
        (7,7,"Kumon","Educação",1488,1400),
        (8,11,"CVC Brasil","Hotelaria e Turismo",1279,1097),
        (9,9,"Wizard by Pearson","Educação",1250,1195),
        (10,8,"BR Mania","Alimentação",1231,1311),
    ]
    for pos, pos_ant, marca, seg, unid, unid_ant in ranking_2018:
        var = round((unid/unid_ant-1)*100,1) if unid_ant else None
        c.execute("""INSERT OR IGNORE INTO ranking
            (ano,posicao,posicao_ant,marca,segmento,unidades,unidades_ant,var_pct)
            VALUES(?,?,?,?,?,?,?,?)""", (2018,pos,pos_ant,marca,seg,unid,unid_ant,var))

    # ── RANKING 2020 ─────────────────────────────────────────────────────
    ranking_2020 = [
        (1,1,"O Boticário","Saúde, Beleza e Bem-Estar",3620,3806,-5.0),
        (2,2,"McDonald's","Alimentação",2567,2459,4.0),
        (3,4,"Cacau Show","Alimentação",2371,2322,2.0),
        (4,5,"Subway","Alimentação",1863,1864,0.0),
        (5,3,"AM/PM","Alimentação",1804,2377,-24.0),
        (6,7,"Lubrax+","Serviços Automotivos",1665,1643,1.0),
        (7,10,"CVC Brasil","Hotelaria e Turismo",1425,1414,1.0),
        (8,11,"Óticas Carol","Saúde, Beleza e Bem-Estar",1394,1335,4.0),
        (9,12,"Seguralta","Serviços e Outros Negócios",1325,1325,0.0),
        (10,14,"Burger King","Alimentação",1302,1209,8.0),
        (17,25,"Odontocompany","Saúde, Beleza e Bem-Estar",997,634,57.0),
    ]
    for pos, pos_ant, marca, seg, unid, unid_ant, var in ranking_2020:
        c.execute("""INSERT OR IGNORE INTO ranking
            (ano,posicao,posicao_ant,marca,segmento,unidades,unidades_ant,var_pct)
            VALUES(?,?,?,?,?,?,?,?)""", (2020,pos,pos_ant,marca,seg,unid,unid_ant,var))

    # ── RANKING 2022 ─────────────────────────────────────────────────────
    ranking_2022 = [
        (1,2,"Cacau Show","Alimentação",3763,2827,33.1),
        (2,1,"O Boticário","Saúde, Beleza e Bem-Estar",3687,3652,1.0),
        (3,3,"McDonald's","Alimentação",2595,2585,0.4),
        (4,5,"Colchões Ortobom","Casa e Construção",2373,2078,14.2),
        (5,12,"Odontocompany","Saúde, Beleza e Bem-Estar",1998,1631,22.5),
        (6,7,"Subway","Alimentação",1861,1862,-0.1),
        (7,8,"AM/PM","Alimentação",1774,1841,-3.6),
        (8,9,"Seguralta","Serviços e Outros Negócios",1755,1682,4.3),
        (9,10,"Lubrax+","Serviços Automotivos",1711,1668,2.6),
        (10,14,"Óticas Carol","Saúde, Beleza e Bem-Estar",1460,1460,0.0),
    ]
    for pos, pos_ant, marca, seg, unid, unid_ant, var in ranking_2022:
        c.execute("""INSERT OR IGNORE INTO ranking
            (ano,posicao,posicao_ant,marca,segmento,unidades,unidades_ant,var_pct)
            VALUES(?,?,?,?,?,?,?,?)""", (2022,pos,pos_ant,marca,seg,unid,unid_ant,var))

    # ── RANKING 2023 ─────────────────────────────────────────────────────
    ranking_2023 = [
        (1,1,"Cacau Show","Alimentação",4216,3763,10.7),
        (2,2,"O Boticário","Saúde, Beleza e Bem-Estar",3689,3687,0.05),
        (3,3,"McDonald's","Alimentação",2662,2595,2.5),
        (4,4,"Colchões Ortobom","Casa e Construção",2380,2373,0.3),
        (5,5,"Odontocompany","Saúde, Beleza e Bem-Estar",1899,1998,-5.2),
        (6,9,"Lubrax+","Serviços Automotivos",1741,1711,1.7),
        (10,11,"Burger King","Alimentação",1331,1255,5.7),
        (15,None,"Chilli Beans","Moda",1116,966,13.4),
        (18,None,"Espaçolaser","Saúde, Beleza e Bem-Estar",1005,808,19.6),
    ]
    for pos, pos_ant, marca, seg, unid, unid_ant, var in ranking_2023:
        c.execute("""INSERT OR IGNORE INTO ranking
            (ano,posicao,posicao_ant,marca,segmento,unidades,unidades_ant,var_pct)
            VALUES(?,?,?,?,?,?,?,?)""", (2023,pos,pos_ant,marca,seg,unid,unid_ant,var))

    conn.commit()
    conn.close()
    print("Dados históricos inseridos.")

if __name__ == "__main__":
    init_db()
    seed_historico()
