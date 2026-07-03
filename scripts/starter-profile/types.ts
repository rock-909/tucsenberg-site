import type {
  StarterMessageNamespace,
  StarterProfileId,
} from "../../src/config/starter-profiles";

export interface MaterializationWarning {
  code: "missing-source";
  message: string;
  path: string;
  type: "missing-source";
}

export interface StarterProfileMaterializationPlan {
  profileId: StarterProfileId;
  includedRouteRoots: readonly string[];
  excludedRouteRoots: readonly string[];
  includedFixtureRoots: readonly string[];
  excludedFixtureRoots: readonly string[];
  excludedSourceRoots: readonly string[];
  includedMessagePackRoots: readonly string[];
  excludedMessagePackRoots: readonly string[];
  includedMessageNamespaces: readonly StarterMessageNamespace[];
  excludedMessageNamespaces: readonly StarterMessageNamespace[];
  warnings: readonly MaterializationWarning[];
}

export interface MaterializedFileSet {
  profileId: StarterProfileId;
  includedFiles: readonly string[];
  excludedFiles: readonly string[];
  warnings: readonly MaterializationWarning[];
}

export interface MaterializedMessageSet {
  profileId: StarterProfileId;
  locales: readonly string[];
  includedNamespaces: readonly StarterMessageNamespace[];
  excludedNamespaces: readonly StarterMessageNamespace[];
}
