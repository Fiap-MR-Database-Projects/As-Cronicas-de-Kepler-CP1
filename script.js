const API = "http://127.0.0.1:8000"

function getAtivos(){
    return fetch(API + "/api/ativos")
        .then(response => {

            if(!response.ok){
                throw new Error("Falha ao carregar ativos")
            }

            return response.json()
        })
}

function processarEvento(evento){

    return fetch(API + "/api/processar", {

        method: "POST",

        headers:{
            "Content-Type":"application/json"
        },

        body: JSON.stringify(evento)

    })
    .then(response => {

        if(!response.ok){
            throw new Error("Falha ao processar evento")
        }

        return response.json()

    })
}

const eventoForm = document.getElementById("evento-form")
const formMessage = document.getElementById("form-message")
const ativosList = document.getElementById("ativos-list")


function renderAtivos(ativos){

    if(!Array.isArray(ativos) || ativos.length === 0){

        ativosList.innerHTML =
        '<li class="rounded border border-slate-600 bg-slate-900 p-3 text-sm">Nenhum ativo encontrado.</li>'

        return
    }

    ativosList.innerHTML = ativos.map(ativo => {

    return `
    <tr class="hover:bg-slate-800">

    <td class="border border-slate-700 px-3 py-2">
    ${ativo.id_ativo}
    </td>

    <td class="border border-slate-700 px-3 py-2">
    ${ativo.nome}
    </td>

    <td class="border border-slate-700 px-3 py-2">
    ${ativo.setor}
    </td>

    <td class="border border-slate-700 px-3 py-2">
    ${ativo.preco_base}
    </td>
    
    <td class="border border-slate-700 px-3 py-2">
    ${ativo.estoque}
    </td>

    </tr>
    `

    }).join("")

}


async function loadAtivos(){

    try{

        const ativos = await getAtivos()

        renderAtivos(ativos)

    }catch(error){

        console.error(error)

        ativosList.innerHTML =
        '<li class="rounded border border-red-700 bg-slate-900 p-3 text-sm text-red-400">Erro ao carregar ativos.</li>'
    }

}

loadAtivos()


if(eventoForm){

    eventoForm.addEventListener("submit", async (event)=>{

        event.preventDefault()

        const dados = {

            evento: document.getElementById("evento").value,
            setor: document.getElementById("setor").value,
            percentual: Number(document.getElementById("percentual").value)

        }

        try{

            await processarEvento(dados)

            formMessage.textContent = "Evento processado com sucesso"
            formMessage.className = "mt-3 text-sm text-emerald-400"

            eventoForm.reset()

            await loadAtivos()

        }catch{

            formMessage.textContent = "Erro ao processar evento"
            formMessage.className = "mt-3 text-sm text-red-400"

        }

    })

}

