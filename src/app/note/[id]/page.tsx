import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PrintButton } from "@/components/print-button"
import { RichText } from "@/components/rich-text"
import { getMembers, getNote, getSoftwares } from "@/lib/data"
import { DEFAULT_LOGO, softwareFinder, uniqueLogos } from "@/lib/logos"
import { fullName } from "@/lib/types"
import { formatDate } from "@/lib/utils"

export default async function PrintNotePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const [note, members, softwares] = await Promise.all([getNote(id), getMembers(), getSoftwares()])
    if (!note) notFound()

    const { sections } = note
    const date = formatDate(note.date)
    const authorRole = members.find(m => fullName(m) === note.author)?.role
    const findSoftware = softwareFinder(softwares)

    // Page de garde : uniquement les logiciels qui ont un logo 3D importé
    const coverLogos = uniqueLogos(sections.map(s => s.name), softwares, "logo3d", false)
    const tabletVersion = sections.find(s => s.name.toLowerCase() === "tablette" && s.tabletVersion)?.tabletVersion

    return (
        <div className="min-h-screen py-10 print:bg-white print:py-0">
            {/* Logo répété en haut de chaque page imprimée ; à l'écran, celui de l'en-tête suffit */}
            <div className="hidden print:block fixed top-8 left-8 z-50">
                <Image
                    src="/logo-ianord-bleu.svg"
                    alt="Ianord"
                    width={100}
                    height={34}
                />
            </div>

            {/* Barre d'outils */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <Button variant="ghost" tooltip="Revenir à l'accueil" asChild>
                    <Link href="/"><ArrowLeft className="h-4 w-4" />Retour</Link>
                </Button>
                <div className="flex gap-2">
                    <Button variant="secondary" tooltip="Modifier le contenu de cette note" asChild>
                        <Link href={`/builder?id=${id}`}><Pencil className="h-4 w-4" /> Éditer</Link>
                    </Button>
                    <PrintButton />
                </div>
            </div>

            <div className="max-w-4xl mx-auto bg-white p-8 shadow-sm border print:shadow-none print:border-none print:pt-32 print:px-8 print:max-w-none print:w-full">

                {/* --- PAGE DE GARDE --- */}
                <div className="relative flex flex-col justify-center min-h-[90vh] print:min-h-0 print:h-[220mm] pb-10 print:pb-0 break-after-page">

                    {/* Dégradé pleine page. À l'impression, il recouvre les marges du conteneur et passe
                        au-dessus du logo et du pied de page fixes (z-50) : la couverture a son propre logo. */}
                    <div
                        aria-hidden
                        className="cover-background absolute -inset-x-8 -top-8 bottom-0 print:-top-32 print:bottom-auto print:h-[297mm] print:z-[55]"
                    >
                        <Image
                            src="/logo-ianord-bleu.svg"
                            alt=""
                            width={100}
                            height={34}
                            className="hidden print:block absolute top-8 left-8"
                        />
                    </div>

                    {/* Contenu Central */}
                    <div className="relative print:z-[56] flex flex-col items-center justify-center text-center space-y-6">

                        <div className="space-y-4">
                            <h1 className="text-[48px] font-bold font-heading text-slate-800 tracking-tight">
                                Note de patch du {date}
                            </h1>
                            <p className="text-[20px] font-medium font-sans text-slate-600">
                                Évolutions, correctifs et uniformisation de l&apos;expérience
                            </p>
                        </div>

                        {/* Logos Logiciels (Centrés) */}
                        {coverLogos.length > 0 && (
                            <div className="flex gap-0 items-center justify-center">
                                {coverLogos.map(logo => (
                                    // eslint-disable-next-line @next/next/no-img-element -- logos servis depuis la base, sans optimisation
                                    <img key={logo.url} src={logo.url} alt={logo.name} className="w-[250px] h-auto" />
                                ))}
                            </div>
                        )}

                        {/* Numéro de version Tablette */}
                        {tabletVersion && (
                            <div className="mt-2 text-[20px] font-semibold text-slate-600">
                                Version {tabletVersion}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- PAGE 2 : INTRODUCTION --- */}
                <div className="relative flex flex-col min-h-[90vh] print:min-h-0 print:h-auto pt-36 break-after-page">
                    <div className="space-y-12">
                        <h2 className="text-[40px] font-bold font-heading text-slate-800 tracking-tight">
                            Note de patch du {date}
                        </h2>

                        <div className="text-[18px] font-normal font-sans text-slate-700 leading-relaxed space-y-6 text-justify">
                            {note.intro.split("\n").map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>

                        <div className="pt-1 text-slate-500 font-medium font-sans text-[14px]">
                            <p>Présentation préparée par {note.author}{authorRole && ` – ${authorRole}`}</p>
                        </div>
                    </div>
                </div>

                {/* --- CONTENU DETAILLE (Pages suivantes) --- */}
                <div className="pt-8 print:pt-0">
                    <div className="space-y-12">
                        {sections.map((section, idx) => {
                            const logo = findSoftware(section.name)?.logoFlat?.url ?? DEFAULT_LOGO

                            return (
                                <table key={idx} className="w-full print:mb-0 break-inside-auto border-separate border-spacing-0">
                                    <thead className="print:table-header-group">
                                        <tr>
                                            <th className="text-left p-0 border-none print:h-[48mm] align-bottom font-normal">
                                                <div className="bg-slate-50/50 p-6 border border-slate-200 rounded-t-2xl border-b-0">
                                                    <div className="flex items-center gap-2">
                                                        {/* eslint-disable-next-line @next/next/no-img-element -- logos servis depuis la base */}
                                                        <img src={logo} alt={section.name} className="w-8 h-8 object-contain" />
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
                                                                    {section.features.map((f, i) => (
                                                                        <li key={i} className="text-slate-600 text-[16px] font-normal font-sans flex items-start gap-3 leading-relaxed">
                                                                            <span className="text-green-500 font-bold shrink-0">+</span>
                                                                            <RichText text={f.text} />
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
                                                                    {section.fixes.map((f, i) => (
                                                                        <li key={i} className="text-slate-600 text-[16px] font-normal font-sans flex items-start gap-3 leading-relaxed">
                                                                            <span className="text-orange-500 font-bold shrink-0">✓</span>
                                                                            <RichText text={f.text} />
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
                            )
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