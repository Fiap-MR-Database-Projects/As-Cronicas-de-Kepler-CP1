from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI
from api.database import get_connection
from pydantic import BaseModel

app = FastAPI()
app.mount("/static", StaticFiles(directory="."), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # permite qualquer origem
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EventoRequest(BaseModel):
    evento: str
    setor: str
    percentual: float

@app.get("/")
def home():
    return FileResponse("index.html")

@app.get("/ativos")
def listar_ativos():
    
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id_ativo, nome, setor, preco_base, estoque
        FROM TB_ATIVOS_GALACTICOS
    """)

    rows = cursor.fetchall()

    ativos = []

    for r in rows:
        ativos.append({
            "id_ativo": r[0],
            "nome": r[1],
            "setor": r[2],
            "preco_base": r[3],
            "estoque": r[4]
        })

    return ativos


@app.post("/processar")
def processar_evento(dados: EventoRequest):

    conn = get_connection()
    cursor = conn.cursor()

    plsql = """
    DECLARE
        v_evento VARCHAR2(30) := :evento;
        v_setor VARCHAR2(30) := :setor;
        v_percentual NUMBER := :percentual;

        CURSOR c_ativos IS
            SELECT id_ativo, preco_base
            FROM TB_ATIVOS_GALACTICOS
            WHERE setor = v_setor;

    BEGIN

        IF v_evento = 'RADIACAO' THEN
            v_percentual := (v_percentual * -1) / 100; -- Reduz o preço em caso de radiação
        ELSIF v_evento = 'DESCOBERTA_MINA' THEN
            v_percentual := v_percentual / 100; -- Aumenta o preço em caso de descoberta de mina
        ELSE
            v_percentual := 0;
        END IF;

        FOR r IN c_ativos LOOP

            UPDATE TB_ATIVOS_GALACTICOS
            SET preco_base = r.preco_base + (r.preco_base * v_percentual)
            WHERE id_ativo = r.id_ativo;

        END LOOP;

        COMMIT;

    END;
    """

    cursor.execute(
        plsql,
        evento=dados.evento,
        setor=dados.setor,
        percentual=dados.percentual
    )

    cursor.close()
    conn.close()

    return {
        "status": "Evento aplicado com sucesso",
        "evento": dados.evento,
        "setor": dados.setor
    }