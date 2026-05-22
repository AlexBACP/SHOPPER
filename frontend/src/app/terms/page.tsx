import { Metadata } from 'next';
import Link from 'next/link';
import { Scale, ArrowLeft, FileText, Shield, UserCheck, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso del marketplace Shopper Colombia.',
};

const SECTIONS = [
  {
    icon: FileText,
    color: 'bg-blue-100 text-blue-700',
    titulo: '1. Aceptación de los términos',
    contenido: `Al acceder y utilizar la plataforma Shopper, usted acepta estar sujeto a estos Términos y Condiciones de Uso. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio.

Shopper es una plataforma de comercio electrónico que conecta compradores y vendedores independientes en Colombia. Nos reservamos el derecho de modificar estos términos en cualquier momento, notificando a los usuarios con al menos 15 días de anticipación.`,
  },
  {
    icon: UserCheck,
    color: 'bg-green-100 text-green-700',
    titulo: '2. Registro y cuentas de usuario',
    contenido: `Para utilizar ciertos servicios de Shopper deberá crear una cuenta. Usted es responsable de:

• Mantener la confidencialidad de su contraseña
• Todas las actividades que ocurran bajo su cuenta  
• Proporcionar información veraz, precisa y actualizada
• Notificar de inmediato cualquier uso no autorizado de su cuenta

Shopper se reserva el derecho de suspender o terminar cuentas que violen estos términos.`,
  },
  {
    icon: Scale,
    color: 'bg-purple-100 text-purple-700',
    titulo: '3. Responsabilidades del vendedor',
    contenido: `Los vendedores (Owners) que publiquen tiendas y productos en Shopper son responsables de:

• La veracidad de la información de sus productos
• Cumplir con la legislación colombiana aplicable a su actividad comercial
• Gestionar adecuadamente el stock y actualizar disponibilidad
• Cumplir con los pedidos en los tiempos acordados
• Garantizar la calidad de los productos ofrecidos

Shopper actúa como intermediario y no es responsable por incumplimientos de los vendedores.`,
  },
  {
    icon: Shield,
    color: 'bg-orange-100 text-orange-700',
    titulo: '4. Compras y pagos',
    contenido: `Los precios mostrados incluyen IVA del 19% según la legislación tributaria colombiana (Estatuto Tributario, Art. 468). 

Los pagos se procesan a través de pasarelas seguras con certificación SSL 256-bit. Shopper no almacena datos de tarjetas de crédito.

Las devoluciones se rigen por el Estatuto del Consumidor colombiano (Ley 1480 de 2011). El comprador tiene derecho a retracto dentro de los 5 días hábiles siguientes a la entrega del producto.`,
  },
  {
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-700',
    titulo: '5. Conductas prohibidas',
    contenido: `Está prohibido en la plataforma:

• Publicar información falsa o engañosa sobre productos
• Vender productos falsificados, ilegales o restringidos
• Manipular el sistema de reseñas y calificaciones
• Realizar transacciones fraudulentas
• Usar la plataforma para actividades de lavado de dinero
• Extraer información de otros usuarios sin autorización

El incumplimiento puede resultar en la suspensión permanente de la cuenta y acciones legales.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero */}
      <div className="bg-[var(--nav-bg)] px-4 md:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[var(--accent)] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-400/30">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Términos y Condiciones</h1>
              <p className="text-white/50 text-sm">Última actualización: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        {/* Aviso legal */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-1">Documento legal vinculante</p>
            <p>Estos términos constituyen un acuerdo legal entre usted y Shopper Colombia SAS. Cumplen con la Ley 527 de 1999 (Comercio Electrónico), Ley 1480 de 2011 (Estatuto del Consumidor) y la Ley 1581 de 2012 (Protección de Datos Personales).</p>
          </div>
        </div>

        {/* Secciones */}
        <div className="space-y-5">
          {SECTIONS.map(({ icon: Icon, color, titulo, contenido }) => (
            <div key={titulo} className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">{titulo}</h2>
              </div>
              <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{contenido}</div>
            </div>
          ))}

          {/* Sección contacto */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">6. Contacto y jurisdicción</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
              Para consultas relacionadas con estos términos contacte: <strong>legal@shopper.co</strong>
            </p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa será resuelta ante los tribunales competentes de la ciudad de Bogotá D.C.
            </p>
          </div>
        </div>

        {/* Footer navegación */}
        <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
          <Link href="/privacy" className="hover:text-[var(--blue)] hover:underline transition-colors">Política de Privacidad</Link>
          <span>·</span>
          <Link href="/" className="hover:text-[var(--blue)] hover:underline transition-colors">Inicio</Link>
          <span>·</span>
          <Link href="/#tiendas" className="hover:text-[var(--blue)] hover:underline transition-colors">Explorar tiendas</Link>
        </div>
      </div>
    </div>
  );
}
