import {
  Employe,
  EmployeRepository,
  ErreurDossierRH,
  ErreurPromotion,
  InfoCertificationWeb,
  NiveauAccreditation,
  ServiceRHLegacy,
  ServiceWebAccreditation,
} from "./model.js";
import * as Opt from "./libs/option.js";
import * as Res from "./libs/result.js";

export function validerCertification(
  apiWeb: ServiceWebAccreditation,
  id: number,
): Res.Result<ErreurPromotion, InfoCertificationWeb> {
  // Version impérative avec Result et Option
  const resApi = apiWeb.recupererCertification(id);
  if (Res.isError(resApi)) {
    return Res.error({ type: "EchecServiceWeb", cause: resApi.error });
  }
  const infoCert = resApi.value;
  if (!infoCert.accredite) {
    return Res.error({ type: "NonAccredite" });
  }
  if (infoCert.scoreExamen < 75) {
    return Res.error({ type: "ScoreInsuffisant", score: infoCert.scoreExamen, requis: 75 });
  }
  return resApi;

  //   // Version fonctionnelle de pure
  //   return Res.flatMap(
  //     Res.flatMap(
  //       Res.mapError<"ServiceIndisponible" | "ReponseInvalide", ErreurPromotion, InfoCertificationWeb>(
  //         apiWeb.recupererCertification(id),
  //         (e: "ServiceIndisponible" | "ReponseInvalide") => ({ type: "EchecServiceWeb", cause: e }),
  //       ),
  //       (infoCert) => (infoCert.accredite ? Res.value(infoCert) : Res.error({ type: "NonAccredite" })),
  //     ),
  //     (infoCert) =>
  //       infoCert.scoreExamen >= 75
  //         ? Res.value(infoCert)
  //         : Res.error({ type: "ScoreInsuffisant", score: infoCert.scoreExamen, requis: 75 }),
  //   );

  //   // Version avec API fluide
  //   return Res.wrapResult(apiWeb.recupererCertification(id))
  //     .mapError<ErreurPromotion>((e) => ({ type: "EchecServiceWeb", cause: e }))
  //     .flatMap((c) => (c.accredite ? Res.value(c) : Res.error({ type: "NonAccredite" })))
  //     .flatMap((c) =>
  //       c.scoreExamen >= 75 ? Res.value(c) : Res.error({ type: "ScoreInsuffisant", score: c.scoreExamen, requis: 75 }),
  //     )
  //     .unwrap();
}

/**
 * EXERCICE 1 — De Option (BD) vers Result
 *
 * Spécifications :
 * 1. Recherchez l'employé dans la BD à l'aide de `repo.trouverParId(id)` (qui retourne un `Option<Employe>`).
 * 2. Convertissez cet `Option<Employe>` en `Result<ErreurPromotion, Employe>` à l'aide de `toResult`
 *    (ou `.toResult(...)` sur le wrapper `option(...)`) :
 *    - Si l'employé est absent de la BD (`None`), retournez l'erreur `{ type: "EmployeIntrouvable", id }`.
 * 3. Utilisez ensuite `flatMap` pour vérifier que l'employé est actif (`employe.actif === true`).
 *    S'il est inactif, retournez `error({ type: "EmployeInactif", id })`.
 */
export function recupererEmployeActif(repo: EmployeRepository, id: number): Res.Result<ErreurPromotion, Employe> {
  throw new Error("À implémenter");
}

/**
 * EXERCICE 2 — De Option (BD) et Result (API Web) vers Option
 *
 * Spécifications :
 * On souhaite consulter le niveau de certification actuel ("Junior" | "Intermediaire" | "Senior")
 * d'un employé actif, sans conserver le détail des erreurs en cas d'échec :
 * 1. Cherchez l'employé avec `repo.trouverParId(id)`.
 * 2. Ne gardez l'employé que s'il est actif (`employe.actif === true`, sinon `none` — vous pouvez utiliser `filter` ou `flatMap`).
 * 3. Appelez `apiWeb.recupererCertification(employe.id)` (`Result`) et convertissez-le en `Option` (avec `toOption` / `.toOption()`), puis :
 *    - Si l'employé est accrédité (`info.accredite === true`), retournez `some(info.niveau)`.
 *    - Si l'appel au service Web échoue ou que l'employé n'est pas accrédité, retournez `none`.
 */
export function obtenirNiveauEmploye(
  repo: EmployeRepository,
  apiWeb: ServiceWebAccreditation,
  id: number,
): Opt.Option<NiveauAccreditation> {
  throw new Error("À implémenter");
}

/**
 * EXERCICE 3 — Promotion
 *
 * Spécifications :
 * Combinez les étapes précédentes pour exécuter le processus complet de promotion d'un employé :
 * 1. Récupérez l'employé actif en BD via `recupererEmployeActif(repo, id)`.
 * 2. Validez sa certification auprès du service Web via `validerCertification(apiWeb, id)`.
 * 3. Si les deux étapes réussissent, créez une copie mise à jour de l'employé avec son niveau
 *    d'accréditation approuvé (`niveauAccreditation: some(certif.niveau)`).
 * 4. Sauvegardez ce nouvel employé dans la BD avec `repo.sauvegarder(employePromu)`.
 * 5. Si la sauvegarde échoue (`"ErreurEcritureDisque"`), transformez l'erreur en `{ type: "EchecSauvegarde" }`.
 */
export function promouvoirEmploye(
  repo: EmployeRepository,
  apiWeb: ServiceWebAccreditation,
  id: number,
): Res.Result<ErreurPromotion, Employe> {
  throw new Error("À implémenter");
}

/**
 * EXERCICE 4 — Refactorisation
 *
 * Spécifications :
 * Réécrivez le corps de `obtenirGestionnaire` de façon 100 % fonctionnelle
 * (sans `try/catch`, sans `if`, et sans `null`), tout en conservant le même comportement.
 *
 * Indices : `tryCatch` (`src/libs/result.ts`), `fromNullable` (`src/libs/option.ts`).
 */
export function obtenirGestionnaire(apiRH: ServiceRHLegacy, id: number): Res.Result<ErreurDossierRH, string> {
  try {
    const dossier = apiRH.chercherDossier(id);
    if (dossier === null) {
      return Res.error({ type: "DossierIntrouvable", id });
    }
    if (dossier.gestionnaire === null || dossier.gestionnaire.trim() === "") {
      return Res.error({ type: "AucunGestionnaire", id });
    }
    return Res.value(dossier.gestionnaire);
  } catch (err) {
    return Res.error({
      type: "ErreurReseauRH",
      message: err instanceof Error ? err.message : "Erreur inconnue",
    });
  }
}
