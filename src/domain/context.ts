export interface ConfirmedPlantContext {
  ubicacion_tipo?: 'interior' | 'balcon' | 'exterior';
  maceta_con_drenaje?: boolean;
  tamano_maceta?: 'pequena' | 'mediana' | 'grande';
  luz_usuario?: 'baja' | 'media' | 'brillante_indirecta' | 'sol_directo';
}

export interface InferredPlantContext {
  ubicacion_tipo?: ConfirmedPlantContext['ubicacion_tipo'] | null;
  maceta_con_drenaje?: boolean | null;
  tamano_maceta?: ConfirmedPlantContext['tamano_maceta'] | null;
  luz_usuario?: ConfirmedPlantContext['luz_usuario'] | null;
}

/** Copies only values explicitly touched by a person into confirmed context. */
export function confirmedContextFromTouched(
  touched: ConfirmedPlantContext,
): ConfirmedPlantContext {
  return Object.fromEntries(
    Object.entries(touched).filter(([, value]) => value !== undefined),
  ) as ConfirmedPlantContext;
}
