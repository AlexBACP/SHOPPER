import { Metadata } from 'next';
import Link from 'next/link';
import { Lock, ArrowLeft, Eye, Database, UserCheck, Mail, Trash2, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad y tratamiento de datos personales de Shopper Colombia — Ley 1581 de 2012.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="bg-[var(--nav-bg)] px-4 md:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Política de Privacidad</h1>
              <p className="text-white/50 text-sm">Ley 1581 de 2012 — Protección de Datos Personales Colombia</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 space-y-5">

        {/* Aviso Ley 1581 */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-3">
          <UserCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-bold mb-1">Cumplimiento Ley 1581 de 2012</p>
            <p>Shopper Colombia cumple con la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013 sobre protección de datos personales. Usted como titular tiene derechos de acceso, rectificación, cancelación y oposición (ARCO).</p>
          </div>
        </div>

        {[
          {
            icon: Database, color: 'bg-blue-100 text-blue-700',
            titulo: '1. Datos que recopilamos',
            contenido: `Recopilamos la siguiente información cuando usa Shopper:

Datos de registro:
• Nombre completo, correo electrónico y contraseña (encriptada)
• Rol de usuario (comprador o vendedor)

Datos de compra:
• Dirección de envío, ciudad y departamento
• Historial de pedidos y productos comprados
• Método de pago (sin almacenar datos de tarjeta)

Datos de navegación:
• Dirección IP y tipo de dispositivo/navegador
• Páginas visitadas y tiempo en el sitio
• Búsquedas realizadas dentro de la plataforma

Datos de vendedor:
• Información de tienda y productos publicados
• Datos bancarios para transferencias (nombre y número de cuenta)`,
          },
          {
            icon: Eye, color: 'bg-purple-100 text-purple-700',
            titulo: '2. Finalidad del tratamiento',
            contenido: `Sus datos personales son utilizados exclusivamente para:

• Crear y gestionar su cuenta de usuario
• Procesar y gestionar sus pedidos de compra
• Facilitar la comunicación entre compradores y vendedores
• Enviar notificaciones transaccionales (confirmación de pedido, estado de envío)
• Mejorar la experiencia de navegación y el servicio
• Cumplir obligaciones legales y fiscales
• Prevenir fraudes y actividades ilícitas

No vendemos, alquilamos ni compartimos sus datos personales con terceros para fines publicitarios sin su consentimiento explícito.`,
          },
          {
            icon: Globe, color: 'bg-orange-100 text-orange-700',
            titulo: '3. Compartición de datos',
            contenido: `Sus datos pueden ser compartidos con:

Procesadores de pago: PSE (ACH Colombia), Nequi (Bancolombia), Daviplata (Davivienda), para procesar transacciones de forma segura. Estos procesan datos bajo sus propias políticas de privacidad.

Empresas de logística: Para coordinar el envío y entrega de sus pedidos. Únicamente reciben nombre, dirección y teléfono.

Autoridades competentes: Cuando sea requerido por ley, orden judicial o para prevenir actividades fraudulentas o ilegales.

Nunca compartiremos sus datos con anunciantes publicitarios de terceros.`,
          },
          {
            icon: Lock, color: 'bg-green-100 text-green-700',
            titulo: '4. Seguridad de los datos',
            contenido: `Implementamos medidas técnicas y organizativas para proteger su información:

• Cifrado SSL/TLS 256-bit en todas las comunicaciones
• Contraseñas almacenadas con hash bcrypt (nunca en texto plano)
• Tokens JWT con expiración automática
• Acceso a datos restringido por roles
• Auditorías de seguridad periódicas
• Copias de seguridad diarias cifradas

Ningún sistema es 100% seguro. En caso de una brecha de seguridad que afecte sus datos, le notificaremos en un plazo máximo de 72 horas.`,
          },
          {
            icon: UserCheck, color: 'bg-indigo-100 text-indigo-700',
            titulo: '5. Sus derechos (ARCO)',
            contenido: `Como titular de datos personales en Colombia, usted tiene derecho a:

Acceso: Conocer qué datos personales tenemos almacenados sobre usted.
Rectificación: Corregir datos inexactos o incompletos.
Cancelación: Solicitar la eliminación de sus datos cuando ya no sean necesarios.
Oposición: Oponerse al tratamiento de sus datos para fines específicos.

Para ejercer estos derechos envíe un correo a privacidad@shopper.co con asunto "Derechos ARCO", indicando:
• Su nombre completo y correo registrado
• El derecho que desea ejercer
• La información específica de su solicitud

Responderemos en un plazo máximo de 15 días hábiles.`,
          },
          {
            icon: Trash2, color: 'bg-red-100 text-red-700',
            titulo: '6. Retención y eliminación de datos',
            contenido: `Conservamos sus datos personales durante el tiempo necesario para:

• La vigencia de su cuenta en la plataforma
• El cumplimiento de obligaciones legales (mínimo 5 años según normativa tributaria colombiana)
• La resolución de disputas y reclamaciones

Al solicitar la eliminación de su cuenta, procederemos a anonimizar o eliminar sus datos personales en un plazo de 30 días hábiles, excepto aquellos que debamos conservar por obligación legal.

Los datos de transacciones se conservan 5 años según requerimiento de la DIAN.`,
          },
          {
            icon: Mail, color: 'bg-teal-100 text-teal-700',
            titulo: '7. Cookies y tecnologías similares',
            contenido: `Shopper utiliza cookies y tecnologías de almacenamiento local para:

Esenciales (no desactivables):
• Mantener su sesión iniciada
• Recordar los artículos en su carrito
• Seguridad y prevención de fraudes

De preferencia (desactivables):
• Recordar sus configuraciones de idioma y región
• Mejorar la experiencia de navegación

No utilizamos cookies de seguimiento publicitario de terceros. Puede gestionar las cookies desde la configuración de su navegador.`,
          },
        ].map(({ icon: Icon, color, titulo, contenido }) => (
          <div key={titulo} className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">{titulo}</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{contenido}</p>
          </div>
        ))}

        {/* Contacto DPO */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[var(--accent)]" /> Contacto — Oficial de Protección de Datos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
            <div className="bg-[var(--surface-2)] rounded-xl p-4">
              <p className="font-semibold text-[var(--text-primary)] mb-1">Shopper Colombia</p>
              <p>privacidad@shopper.co</p>
              <p>Bogotá D.C., Colombia</p>
            </div>
            <div className="bg-[var(--surface-2)] rounded-xl p-4">
              <p className="font-semibold text-[var(--text-primary)] mb-1">Superintendencia de Industria y Comercio</p>
              <p className="text-xs">Para ejercer quejas formales ante la autoridad de control</p>
              <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer"
                className="text-[var(--blue)] hover:underline text-xs mt-1 block">www.sic.gov.co</a>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border)] flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
          <Link href="/terms" className="hover:text-[var(--blue)] hover:underline transition-colors">Términos y Condiciones</Link>
          <span>·</span>
          <Link href="/" className="hover:text-[var(--blue)] hover:underline transition-colors">Inicio</Link>
        </div>
      </div>
    </div>
  );
}
