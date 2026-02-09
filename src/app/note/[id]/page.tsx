import sql from "@/lib/db"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from "lucide-react"
import Link from "next/link"
import { PrintButton } from "@/components/ui/print-button"
import Image from "next/image"

function getLogoPath(softwareName: string) {
    const normalize = (str: string) => str.toLowerCase().trim();
    const name = normalize(softwareName);

    if (name.includes('webresto')) return '/logos-3d/webresto.svg';
    if (name.includes('webhoraire')) return '/logos-3d/webhoraire.svg';
    if (name.includes('webgerest')) return '/logos-3d/webgerest.svg';
    if (name.includes('tarrification') || name.includes('tarification')) return '/logos-3d/tarification.svg';
    if (name.includes('inscription')) return '/logos-3d/Inscription – Gestionnaire.svg'; // Check file name case?
    if (name.includes('réservation') || name.includes('reservation')) return '/logos-3d/Réservation.svg';
    if (name.includes('back')) return '/logos-3d/Back.svg';
    if (name.includes('cfa')) return '/logos-3d/cfa.svg';
    if (name.includes('bo')) return '/logos-3d/bo.svg';
    if (name.includes('autre')) return '/logos-3d/Autre.svg';

    return null;
}

function getFlatLogoPath(softwareName: string) {
    const normalize = (str: string) => str.toLowerCase().trim();
    const name = normalize(softwareName);

    if (name.includes('webresto')) return '/logos/WebResto.svg';
    if (name.includes('webhoraire')) return '/logos/WebHoraire.svg';
    if (name.includes('webgerest')) return '/logos/WebGerest.svg';
    if (name.includes('tarrification') || name.includes('tarification')) return '/logos/Tarification – Famille.svg'; // Ou gestionnaire, à définir
    if (name.includes('inscription')) return '/logos/Inscription – Gestionnaire.svg';
    if (name.includes('réservation') || name.includes('reservation')) return '/logos/Réservation.svg';
    if (name.includes('back')) return '/logos/Back.svg';
    if (name.includes('cfa')) return '/logos/CFA.svg';
    if (name.includes('bo')) return '/logos/BO.svg';
    if (name.includes('autre')) return '/logos/Autre.svg';

    return null;
}

// Fonction pour déterminer le rôle selon le nom
function getAuthorTitle(authorName: string) {
    const normalize = (str: string) => str.toLowerCase().trim();
    const name = normalize(authorName);

    if (name.includes('maufroid')) return 'Manager BACK';
    if (name.includes('guillaume')) return 'Manager FRONT';

    return 'Manager développeur';
}

// On définit params comme une promesse
export default async function PrintNotePage({ params }: { params: Promise<{ id: string }> }) {

    // 1. On attend que les paramètres de l'URL soient prêts
    const { id } = await params;

    // 2. Récupération de la note (l'id ne sera plus undefined)
    const [note] = await sql`SELECT * FROM "PatchNote" WHERE id = ${id}`

    if (!note) notFound()

    const sections = typeof note.content === 'string' ? JSON.parse(note.content) : note.content

    // Filtrer les logos à afficher (Uniquement les "Web...")
    const softwareLogos = sections
        .map((s: any) => ({ name: s.name, logo: getLogoPath(s.name) }))
        .filter((item: any) => item.logo !== null)
        // PAGE DE GARDE : On ne veut que les logos des logiciels "Web..."
        .filter((item: any) => item.name.toLowerCase().includes('web'))
        // Dédoublonnage au cas où
        .filter((item: any, index: number, self: any[]) =>
            index === self.findIndex((t) => t.name === item.name)
        );

    return (
        <div className="min-h-screen py-10 print:bg-white print:py-0">
            {/* --- HEADER FIXE (LOGO SUR TOUTES LES PAGES) --- */}
            <div className="print:block fixed top-8 left-8 z-50">
                <Image
                    src="/logo_ianord_bleu.svg"
                    alt="Ianord"
                    width={100}
                    height={34}
                />
            </div>



            {/* Barre d'outils */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <Link href="/">
                    <Button variant="ghost"><ArrowLeft className="h-4 w-4" />Retour</Button>
                </Link>
                <div className="flex gap-2">
                    <Link href={`/builder?id=${id}`}>
                        <Button variant="secondary">
                            <Pencil className="h-4 w-4" /> Éditer
                        </Button>
                    </Link>
                    {/* On utilise une fonction simple pour l'impression */}
                    <PrintButton />
                </div>
            </div>

            <div className="max-w-4xl mx-auto bg-white p-8 shadow-sm border print:shadow-none print:border-none print:pt-32 print:px-8 print:max-w-none print:w-full">

                {/* --- PAGE DE GARDE --- */}
                <div className="relative flex flex-col justify-center min-h-[90vh] print:min-h-0 print:h-[220mm] pb-10 print:pb-0 break-after-page">

                    {/* Masque pour cacher le numéro de page sur la page 1 */}
                    <div className="hidden print:block absolute bottom-0 right-0 w-32 h-20 bg-white z-[60]"></div>

                    {/* Contenu Central */}
                    <div className="flex flex-col items-center justify-center text-center space-y-6">

                        <div className="space-y-4">
                            <h1 className="text-[48px] font-bold font-heading text-slate-800 tracking-tight">
                                Note de patch du {new Date(note.date).toLocaleDateString('fr-FR')}
                            </h1>
                            <p className="text-[20px] font-medium font-sans text-slate-600">
                                Évolutions, correctifs et uniformisation de l'expérience
                            </p>
                        </div>

                        {/* Logos Logiciels (Centrés) */}
                        {softwareLogos.length > 0 && (
                            <div className="flex gap-0 items-center justify-center">
                                {softwareLogos.map((item: any, idx: number) => (
                                    <div key={idx} className="relative group">
                                        <Image
                                            src={item.logo}
                                            alt={item.name}
                                            width={250}
                                            height={250}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- PAGE 2 : INTRODUCTION --- */}
                <div className="relative flex flex-col min-h-[90vh] print:min-h-0 print:h-auto pt-36 break-after-page">
                    <div className="space-y-12">
                        <h2 className="text-[40px] font-bold font-heading text-slate-800 tracking-tight">
                            Note de patch du {new Date(note.date).toLocaleDateString('fr-FR')}
                        </h2>

                        <div className="text-[18px] font-normal font-sans text-slate-700 leading-relaxed space-y-6 text-justify">
                            {note.intro.split('\n').map((line: string, i: number) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>

                        <div className="pt-1 text-slate-500 font-medium font-sans text-[14px]">
                            <p>Présentation préparée par {note.author} – {getAuthorTitle(note.author)}</p>
                        </div>
                    </div>
                </div>

                {/* --- CONTENU DETAILLE (Pages suivantes) --- */}
                <div className="pt-8 print:pt-0">
                    <div className="space-y-12">
                        {sections.map((section: any, idx: number) => {
                            const logoPath = getFlatLogoPath(section.name);

                            return (
                                <table key={idx} className="w-full print:mb-0 break-inside-auto border-separate border-spacing-0">
                                    <thead className="print:table-header-group">
                                        <tr>
                                            <th className="text-left p-0 border-none print:h-[48mm] align-bottom font-normal">
                                                <div className="bg-slate-50/50 p-6 border border-slate-200 rounded-t-2xl border-b-0">
                                                    <div className="flex items-center gap-2">
                                                        {logoPath && (
                                                            <img
                                                                src={logoPath}
                                                                alt={section.name}
                                                                className="w-8 h-8 object-contain"
                                                            />
                                                        )}
                                                        <h3 className="text-[18px] font-bold font-heading text-slate-800">
                                                            {section.name}
                                                        </h3>
                                                    </div>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tfoot className="hidden print:table-footer-group">
                                        <tr>
                                            <td className="h-0 print:h-[10mm] border-none print:border-t print:border-slate-200"></td>
                                        </tr>
                                    </tfoot>
                                    <tbody>
                                        <tr>
                                            <td className="p-0 border-none align-top">
                                                <div className="p-6 border border-slate-200 rounded-b-2xl border-t-0 box-decoration-clone" style={{ WebkitBoxDecorationBreak: 'clone', boxDecorationBreak: 'clone' }}>
                                                    <div className="grid grid-cols-1 gap-6">
                                                        {section.features?.length > 0 && (
                                                            <div>
                                                                <h4 className="text-[18px] font-bold font-heading text-green-600 uppercase tracking-wider mb-4 mt-2">
                                                                    Nouvelles fonctionnalités
                                                                </h4>
                                                                <ul className="space-y-3">
                                                                    {section.features.map((f: any, i: number) => (
                                                                        <li key={i} className="text-slate-600 text-[16px] font-normal font-sans flex items-start gap-3 leading-relaxed">
                                                                            {/*<span className="text-slate-400 shrink-0">•</span>*/}
                                                                            <span className="text-green-500 font-bold shrink-0">+</span>
                                                                            <span dangerouslySetInnerHTML={{ __html: f.text }}></span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {section.fixes?.length > 0 && (
                                                            <div>
                                                                <h4 className="text-[18px] font-bold font-heading text-orange-600 uppercase tracking-wider mb-4 mt-2">
                                                                    Correctifs
                                                                </h4>
                                                                <ul className="space-y-3">
                                                                    {section.fixes.map((f: any, i: number) => (
                                                                        <li key={i} className="text-slate-600 text-[16px] font-normal font-sans flex items-start gap-3 leading-relaxed">
                                                                            <span className="text-orange-500 font-bold shrink-0">✓</span>
                                                                            <span dangerouslySetInnerHTML={{ __html: f.text }}></span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        })}
                    </div>

                    <div className="mt-24 pt-8 border-t border-slate-100 text-center text-slate-400 text-[12px] font-normal font-sans uppercase tracking-widest print:fixed print:bottom-0 print:left-0 print:w-full print:bg-white print:pb-4 print:pt-4 print:z-50 print:mt-0 print:border-none">
                        Document confidentiel - Ianord © {new Date().getFullYear()}
                    </div>
                </div>
            </div>
        </div>
    )
}