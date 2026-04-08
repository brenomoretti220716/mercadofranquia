'use client'

import Header from '@/src/components/header/Header'

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Termos de Uso – Mercado Franquia
          </h1>

          <section className="space-y-4 text-sm md:text-base text-muted-foreground">
            <div>
              <h2 className="font-semibold text-foreground mb-2">
                1. Do Aceite
              </h2>
              <p>
                O cadastro e utilização da plataforma Mercado Franquia
                pressupõem a leitura, compreensão e concordância integral do
                usuário com estes Termos de Uso e com a Política de Privacidade.
                O aceite eletrônico, mediante seleção do campo específico
                (checkbox), possui plena validade jurídica, vinculando o usuário
                às disposições aqui estabelecidas.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-foreground mb-2">
                2. Dos Perfis de Usuário
              </h2>
              <p className="mb-2">
                A plataforma admite três modalidades de utilização:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Candidato</strong>: interessado em conhecer, comparar
                  e avaliar franquias.
                </li>
                <li>
                  <strong>Franqueador</strong>: pessoa jurídica ou representante
                  legal responsável pelo cadastro e atualização de informações
                  referentes à sua rede.
                </li>
                <li>
                  <strong>Franqueado</strong>: operador de unidade(s),
                  autorizado a interagir com informações relacionadas à rede
                  franqueadora.
                </li>
              </ul>
              <p className="mt-2">
                Cada perfil terá acesso restrito às funcionalidades pertinentes,
                sendo vedada a utilização indevida ou em desconformidade com sua
                finalidade.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-foreground mb-2">
                3. Do Uso das Informações
              </h2>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Candidatos</strong>: autorizam a utilização dos dados
                  fornecidos para análise de perfil, contato e disponibilização
                  de oportunidades de franquia.
                </li>
                <li>
                  <strong>Franqueadores</strong>: assumem inteira
                  responsabilidade pela veracidade, completude e atualização dos
                  dados inseridos, respondendo por eventuais prejuízos causados
                  a terceiros em razão de informações incorretas.
                </li>
                <li>
                  <strong>Franqueados</strong>: reconhecem que suas informações
                  poderão ser utilizadas em indicadores estatísticos da rede,
                  tratados de forma consolidada e não individualizada.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-foreground mb-2">
                4. Das Avaliações e Comentários
              </h2>
              <p className="mb-2">
                A plataforma poderá disponibilizar funcionalidades de avaliação
                e comentários sobre franquias.
              </p>
              <p className="mb-2">
                O usuário é exclusivamente responsável pelo conteúdo inserido,
                abstendo-se de publicar informações falsas, injuriosas,
                difamatórias, ofensivas, ilícitas ou que violem direitos de
                terceiros.
              </p>
              <p className="mb-2">
                O Mercado Franquia poderá moderar, remover ou não publicar
                conteúdos que estejam em desacordo com estes Termos. As
                avaliações refletem opiniões individuais e não representam
                posicionamento oficial da plataforma.
              </p>
              <p>
                O usuário concede ao Mercado Franquia, a título gratuito, o
                direito de uso, reprodução e exibição pública dos conteúdos por
                ele disponibilizados (avaliações, notas, comentários),
                exclusivamente para fins de operação da plataforma e divulgação
                institucional.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-foreground mb-2">
                5. Dos Indicadores e Rankings
              </h2>
              <p className="mb-2">
                Os indicadores e rankings exibidos na plataforma têm caráter
                informativo e referencial, podendo incluir dados fornecidos
                diretamente por franqueadores ou obtidos de fontes públicas.
              </p>
              <p className="mb-2">
                O Mercado Franquia não assegura a atualização em tempo real ou a
                precisão absoluta das informações, nem se responsabiliza por
                eventuais prejuízos decorrentes da utilização dos dados.
              </p>
              <p className="mb-2">
                O uso de ícones, setas ou indicadores visuais (tais como 🔺 para
                alta e 🔻 para baixa) é meramente ilustrativo, não constituindo
                recomendação de investimento ou garantia de performance futura.
              </p>
              <p>
                O Mercado Franquia não garante rentabilidade, retorno financeiro
                ou viabilidade comercial das franquias listadas.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-foreground mb-2">
                6. Das Responsabilidades
              </h2>
              <p className="mb-2">
                O usuário compromete-se a utilizar a plataforma de forma ética,
                lícita e compatível com sua finalidade.
              </p>
              <p className="mb-2">
                É vedada a utilização para práticas fraudulentas, divulgação de
                informações enganosas ou qualquer conduta ilícita.
              </p>
              <p className="mb-2">
                O Mercado Franquia não se responsabiliza por negociações,
                contratos ou decisões de investimento tomadas exclusivamente com
                base nas informações apresentadas.
              </p>
              <p>
                O Mercado Franquia poderá suspender ou cancelar, a seu exclusivo
                critério, o cadastro de usuários que violem estes Termos ou
                utilizem a plataforma de forma indevida. Em caso de falhas
                técnicas, indisponibilidade temporária ou perda de dados, o
                Mercado Franquia não será responsabilizado por danos diretos ou
                indiretos eventualmente decorrentes.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-foreground mb-2">
                7. Dos Dados Pessoais
              </h2>
              <p className="mb-2">
                O tratamento de dados pessoais observará a Lei Geral de Proteção
                de Dados – LGPD (Lei nº 13.709/2018).
              </p>
              <p className="mb-2">
                Serão coletados dados como: nome, e-mail, senha, IP, data e hora
                de acesso, user agent e demais informações necessárias à
                autenticação e funcionamento da plataforma.
              </p>
              <p className="mb-2">
                Os dados poderão ser utilizados para autenticação, segurança,
                estatísticas, análises de uso e aprimoramento dos serviços.
              </p>
              <p>
                Os dados pessoais serão armazenados pelo prazo necessário ao
                cumprimento das finalidades acima descritas, podendo o usuário
                solicitar a exclusão mediante requerimento formal, ressalvadas
                as hipóteses legais de retenção.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-foreground mb-2">
                8. Das Alterações
              </h2>
              <p>
                O Mercado Franquia poderá alterar estes Termos de Uso a qualquer
                momento. Em caso de alterações relevantes, os usuários serão
                comunicados previamente. Recomenda-se a consulta periódica desta
                página.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-foreground mb-2">9. Do Foro</h2>
              <p>
                Fica eleito o foro da comarca de São Carlos/SP, com renúncia
                expressa a qualquer outro, por mais privilegiado que seja, para
                dirimir controvérsias oriundas destes Termos.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
