import { compatibilityMappingSchema } from "@/data/product-compatibility/schemas";

const oemCompatibilityDisclaimer = {
  en: "Compatibility information is for replacement planning only. Confirm membrane dimensions, connection style, retaining hardware, and project operating conditions before ordering.",
  es: "La información de compatibilidad es únicamente para planificar el reemplazo. Confirme las dimensiones de la membrana, el estilo de conexión, el hardware de retención y las condiciones de operación del proyecto antes de pedir.",
  zh: "兼容性信息仅用于替换规划。下单前请确认膜片尺寸、连接方式、固定件以及项目运行工况。",
};

function check(en: string, es: string, zh: string) {
  return { en, es, zh };
}

const compatibilityMappingData = [
  {
    id: "sanitaire-silver-series-ii-9-inch-disc-to-tuc-d9-epdm",
    oemModelId: "sanitaire-silver-series-ii-9-inch-disc",
    productVariantId: "tuc-d9-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [
      check(
        "Confirm 9 inch Silver Series II diffuser body",
        'Confirme que el cuerpo del difusor es Silver Series II de 9"',
        '确认为 9" Silver Series II 曝气器盘体',
      ),
      check(
        "Confirm retaining ring and gasket condition",
        "Confirme el estado del anillo de retención y la junta",
        "确认固定环与密封垫的状态",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "sanitaire-silver-series-ii-9-inch-disc-to-tuc-d9-tpu",
    oemModelId: "sanitaire-silver-series-ii-9-inch-disc",
    productVariantId: "tuc-d9-tpu",
    fitStatus: "custom",
    confidence: "medium",
    requiredChecks: [
      check(
        "Confirm industrial wastewater compatibility need",
        "Confirme la necesidad de compatibilidad con aguas residuales industriales",
        "确认是否存在工业废水工况适配需求",
      ),
      check(
        "Confirm slit pattern and retaining hardware before substitution",
        "Confirme el patrón de ranuras y el hardware de retención antes de sustituir",
        "替换前确认开缝形式与固定件",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "sanitaire-silver-series-ii-7-inch-disc-to-tuc-d7-epdm",
    oemModelId: "sanitaire-silver-series-ii-7-inch-disc",
    productVariantId: "tuc-d7-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [
      check(
        "Confirm 7 inch Silver Series II diffuser body",
        'Confirme que el cuerpo del difusor es Silver Series II de 7"',
        '确认为 7" Silver Series II 曝气器盘体',
      ),
      check(
        "Confirm retainer and integrated check valve condition",
        "Confirme el estado del retenedor y de la válvula de retención integrada",
        "确认固定环与集成单向阀的状态",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "sanitaire-mt-2-to-tuc-t62-epdm",
    oemModelId: "sanitaire-mt-2",
    productVariantId: "tuc-t62-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: [
      check(
        "Confirm 62 mm membrane diameter",
        "Confirme el diámetro de membrana de 62 mm",
        "确认膜片直径为 62 mm",
      ),
      check(
        "Confirm 610 mm membrane length",
        "Confirme la longitud de membrana de 610 mm",
        "确认膜片长度为 610 mm",
      ),
      check(
        "Confirm clamp and end hardware condition",
        "Confirme el estado de las abrazaderas y del hardware de los extremos",
        "确认卡箍与端部固定件的状态",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "sanitaire-mt-2-to-tuc-t62-tpu",
    oemModelId: "sanitaire-mt-2",
    productVariantId: "tuc-t62-tpu",
    fitStatus: "custom",
    confidence: "medium",
    requiredChecks: [
      check(
        "Confirm 62 mm membrane diameter and 610 mm length",
        "Confirme el diámetro de membrana de 62 mm y la longitud de 610 mm",
        "确认膜片直径 62 mm、长度 610 mm",
      ),
      check(
        "Confirm TPU is required by wastewater chemistry",
        "Confirme que la química de las aguas residuales requiere TPU",
        "确认废水化学工况是否需要 TPU",
      ),
      check(
        "Confirm clamp compression with alternate material",
        "Confirme la compresión de la abrazadera con el material alternativo",
        "确认更换材料后卡箍的压紧效果",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "edi-flexair-threaded-disc-7-inch-to-tuc-d7-epdm",
    oemModelId: "edi-flexair-threaded-disc-7-inch",
    productVariantId: "tuc-d7-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [
      check(
        "Confirm 7 inch threaded disc diffuser",
        'Confirme que es un difusor de disco roscado de 7"',
        '确认为 7" 螺纹盘式曝气器',
      ),
      check(
        "Confirm micro or high-capacity airflow target",
        "Confirme el caudal de aire objetivo: micro o alta capacidad",
        "确认目标气量为 micro 还是 high-capacity",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "edi-flexair-threaded-disc-9-inch-to-tuc-d9-epdm",
    oemModelId: "edi-flexair-threaded-disc-9-inch",
    productVariantId: "tuc-d9-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [
      check(
        "Confirm 9 inch threaded disc diffuser",
        'Confirme que es un difusor de disco roscado de 9"',
        '确认为 9" 螺纹盘式曝气器',
      ),
      check(
        "Confirm 228.6 mm membrane class",
        "Confirme la clase de membrana de 228.6 mm",
        "确认膜片规格为 228.6 mm",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "edi-flexair-threaded-disc-9-inch-to-tuc-d9-tpu",
    oemModelId: "edi-flexair-threaded-disc-9-inch",
    productVariantId: "tuc-d9-tpu",
    fitStatus: "custom",
    confidence: "medium",
    requiredChecks: [
      check(
        "Confirm 228.6 mm membrane class",
        "Confirme la clase de membrana de 228.6 mm",
        "确认膜片规格为 228.6 mm",
      ),
      check(
        "Confirm TPU material is needed for process conditions",
        "Confirme que las condiciones del proceso requieren material TPU",
        "确认工艺工况是否需要 TPU 材料",
      ),
      check(
        "Confirm slit and retaining geometry before batch order",
        "Confirme la geometría de ranuras y retención antes del pedido por lote",
        "批量下单前确认开缝与固定结构尺寸",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "edi-flexair-threaded-disc-12-inch-to-tuc-d12-epdm",
    oemModelId: "edi-flexair-threaded-disc-12-inch",
    productVariantId: "tuc-d12-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [
      check(
        "Confirm 12 inch threaded disc diffuser",
        'Confirme que es un difusor de disco roscado de 12"',
        '确认为 12" 螺纹盘式曝气器',
      ),
      check(
        "Confirm 304.8 mm membrane class",
        "Confirme la clase de membrana de 304.8 mm",
        "确认膜片规格为 304.8 mm",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "edi-flexair-t-series-62-mm-to-tuc-t62-epdm",
    oemModelId: "edi-flexair-t-series-62-mm",
    productVariantId: "tuc-t62-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: [
      check(
        "Confirm 62 mm nominal tube family",
        "Confirme la familia de tubo nominal de 62 mm",
        "确认属于 62 mm 标称管径系列",
      ),
      check(
        "Confirm installed membrane length",
        "Confirme la longitud de la membrana instalada",
        "确认已安装膜片的长度",
      ),
      check(
        "Confirm wall thickness and support hardware",
        "Confirme el espesor de pared y el hardware de soporte",
        "确认壁厚与支撑件",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "edi-flexair-t-series-62-mm-to-tuc-t62-tpu",
    oemModelId: "edi-flexair-t-series-62-mm",
    productVariantId: "tuc-t62-tpu",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: [
      check(
        "Confirm 62 mm nominal tube family",
        "Confirme la familia de tubo nominal de 62 mm",
        "确认属于 62 mm 标称管径系列",
      ),
      check(
        "Confirm installed membrane length",
        "Confirme la longitud de la membrana instalada",
        "确认已安装膜片的长度",
      ),
      check(
        "Confirm TPU material is required by process chemistry",
        "Confirme que la química del proceso requiere material TPU",
        "确认工艺化学工况是否需要 TPU 材料",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "edi-flexair-t-series-91-mm-to-tuc-t91-epdm",
    oemModelId: "edi-flexair-t-series-91-mm",
    productVariantId: "tuc-t91-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: [
      check(
        "Confirm 91 mm nominal tube family",
        "Confirme la familia de tubo nominal de 91 mm",
        "确认属于 91 mm 标称管径系列",
      ),
      check(
        "Confirm installed membrane length",
        "Confirme la longitud de la membrana instalada",
        "确认已安装膜片的长度",
      ),
      check(
        "Confirm support requirement for 1003 mm tube bodies",
        "Confirme el requisito de soporte para cuerpos de tubo de 1003 mm",
        "确认 1003 mm 管体的支撑要求",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "ssi-afd270-9-inch-disc-to-tuc-d9-epdm",
    oemModelId: "ssi-afd270-9-inch-disc",
    productVariantId: "tuc-d9-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [
      check(
        "Confirm AFD270 diffuser body",
        "Confirme que el cuerpo del difusor es AFD270",
        "确认为 AFD270 曝气器盘体",
      ),
      check(
        "Confirm membrane gasket and retaining ring condition",
        "Confirme el estado de la junta de la membrana y del anillo de retención",
        "确认膜片密封垫与固定环的状态",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "ssi-afd270-9-inch-disc-to-tuc-d9-tpu",
    oemModelId: "ssi-afd270-9-inch-disc",
    productVariantId: "tuc-d9-tpu",
    fitStatus: "custom",
    confidence: "medium",
    requiredChecks: [
      check(
        "Confirm AFD270 diffuser body",
        "Confirme que el cuerpo del difusor es AFD270",
        "确认为 AFD270 曝气器盘体",
      ),
      check(
        "Confirm TPU substitution is required by wastewater chemistry",
        "Confirme que la química de las aguas residuales requiere la sustitución por TPU",
        "确认废水化学工况是否需要改用 TPU",
      ),
      check(
        "Confirm gasket compression before production order",
        "Confirme la compresión de la junta antes del pedido de producción",
        "量产下单前确认密封垫的压紧效果",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "ssi-aft-62-mm-tube-to-tuc-t62-epdm",
    oemModelId: "ssi-aft-62-mm-tube",
    productVariantId: "tuc-t62-epdm",
    fitStatus: "verify-dimensions",
    confidence: "medium",
    requiredChecks: [
      check(
        "Confirm AFT tube replacement strategy for installed body",
        "Confirme la estrategia de reemplazo del tubo AFT para el cuerpo instalado",
        "确认针对已安装管体的 AFT 管式替换方案",
      ),
      check(
        "Confirm 62 mm diameter and length",
        "Confirme el diámetro de 62 mm y la longitud",
        "确认 62 mm 直径及长度",
      ),
      check(
        "Confirm saddle or nipple connection style",
        "Confirme el estilo de conexión: saddle o nipple",
        "确认连接方式为 saddle 还是 nipple",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "ssi-aft-62-mm-tube-to-tuc-t62-tpu",
    oemModelId: "ssi-aft-62-mm-tube",
    productVariantId: "tuc-t62-tpu",
    fitStatus: "custom",
    confidence: "medium",
    requiredChecks: [
      check(
        "Confirm AFT tube replacement strategy for installed body",
        "Confirme la estrategia de reemplazo del tubo AFT para el cuerpo instalado",
        "确认针对已安装管体的 AFT 管式替换方案",
      ),
      check(
        "Confirm 62 mm diameter and length",
        "Confirme el diámetro de 62 mm y la longitud",
        "确认 62 mm 直径及长度",
      ),
      check(
        "Confirm TPU substitution is required by wastewater chemistry",
        "Confirme que la química de las aguas residuales requiere la sustitución por TPU",
        "确认废水化学工况是否需要改用 TPU",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "ssi-aft-91-mm-tube-to-tuc-t91-epdm",
    oemModelId: "ssi-aft-91-mm-tube",
    productVariantId: "tuc-t91-epdm",
    fitStatus: "verify-dimensions",
    confidence: "medium",
    requiredChecks: [
      check(
        "Confirm AFT tube replacement strategy for installed body",
        "Confirme la estrategia de reemplazo del tubo AFT para el cuerpo instalado",
        "确认针对已安装管体的 AFT 管式替换方案",
      ),
      check(
        "Confirm 91 mm diameter and length",
        "Confirme el diámetro de 91 mm y la longitud",
        "确认 91 mm 直径及长度",
      ),
      check(
        "Confirm saddle or nipple connection style",
        "Confirme el estilo de conexión: saddle o nipple",
        "确认连接方式为 saddle 还是 nipple",
      ),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
] as const;

export const compatibilityMappings = compatibilityMappingSchema
  .array()
  .parse(compatibilityMappingData);
