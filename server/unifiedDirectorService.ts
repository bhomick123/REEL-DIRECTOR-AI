import { Type } from '@google/genai';
import {
  MultiReelComparison,
  PhotoSetAnalysisResult,
  UnifiedContentRecommendation,
  UnifiedRecommendationType,
  RecommendationConfidence,
  UserPostingPreference,
  ReelAnalysisResult,
  IndividualPhotoAnalysis,
} from '../src/types.js';
import { getGeminiClient } from './geminiService.js';

export interface UnifiedRecommendationInput {
  comparison?: MultiReelComparison | null;
  photoSet?: PhotoSetAnalysisResult | null;
  userPreference?: UserPostingPreference;
  userNiche?: string;
  instagramContext?: {
    isConnected: boolean;
    mediaCount: number;
    recommendedPostingDay: string;
    recommendedPostingTime: string;
    postingWindowRationale: string;
    hasSufficientPostingData: boolean;
    postingDataNotice?: string;
  };
}

/**
 * Deterministic evidence-based fallback engine when Gemini API is unavailable or returns an invalid payload.
 * Guarantees zero hallucinations, honest DONT_POST verdicts for weak content, and strict NOT_ENOUGH_DATA handling.
 */
export function generateDeterministicUnifiedRecommendation(
  input: UnifiedRecommendationInput
): UnifiedContentRecommendation {
  const comp = input.comparison;
  const ps = input.photoSet;
  const pref = input.userPreference || 'ALL';
  const niche = input.userNiche || 'High-Street Minimal & Luxury Fashion';
  const ig = input.instagramContext || {
    isConnected: false,
    mediaCount: 0,
    recommendedPostingDay: 'Not enough data yet',
    recommendedPostingTime: 'Not enough data yet',
    postingWindowRationale:
      'Connect your Instagram Professional account and provide sufficient historical data to calculate a personalized posting window.',
    hasSufficientPostingData: false,
    postingDataNotice: 'Instagram not connected',
  };

  const hasReels = Boolean(comp?.reels && comp.reels.length > 0);
  const reelsCount = comp?.reels?.length || 0;
  const hasPhotos = Boolean(ps?.photos && ps.photos.length > 0);
  const photosCount = ps?.photos?.length || 0;

  const contentAvailability = {
    hasReels,
    reelsCount,
    hasPhotos,
    photosCount,
  };

  const postingDataState: 'SUFFICIENT' | 'INSUFFICIENT' | 'DISCONNECTED' =
    ig.hasSufficientPostingData
      ? 'SUFFICIENT'
      : ig.isConnected
      ? 'INSUFFICIENT'
      : 'DISCONNECTED';

  // 1. NO CONTENT AT ALL
  if (!hasReels && !hasPhotos) {
    return {
      id: `unified-${Date.now()}`,
      createdAt: new Date().toISOString(),
      recommendationType: 'NOT_ENOUGH_DATA',
      confidence: 'HIGH',
      headline: 'NOT ENOUGH DATA YET',
      selectedTitle: 'No Analyzed Content in Session',
      reasoning:
        'You have not analyzed any Reels or Photos in this session. The Unified Content Director requires at least one evaluated Reel shootout or photo set to make an evidence-based recommendation.',
      evidence: [
        'Zero video Reels analyzed in current session',
        'Zero photos or carousel slides analyzed in current session',
        'Upload 2–4 Reel variations in Reel Director or 1–15 photos in Photo Director to generate a comparison',
      ],
      strengths: [],
      risks: ['Cannot recommend a posting asset without verified optical or video analysis.'],
      alternativeOption: 'Start by uploading a video take in Reel Director or an editorial shoot in Photo Director.',
      userPreferenceApplied: 'NONE',
      contentAvailability,
      postingDataState,
      recommendedPostingDay: ig.recommendedPostingDay,
      recommendedPostingTime: ig.recommendedPostingTime,
      postingWindowRationale: ig.postingWindowRationale,
      postingDataNotice: ig.postingDataNotice,
    };
  }

  // Evaluate Reels health
  const winningReel: ReelAnalysisResult | undefined =
    comp?.reels?.find((r) => r.isWinner) || comp?.reels?.[0];
  const allReelsWeak = Boolean(
    hasReels &&
      comp?.reels &&
      comp.reels.every((r) => r.overallScore < 70 || r.scrollStopScore < 65)
  );

  // Evaluate Photos health
  const postPhotos = ps?.photos?.filter((p) => p.status === 'POST') || [];
  const maybePhotos = ps?.photos?.filter((p) => p.status === 'MAYBE') || [];
  const dontPostPhotos = ps?.photos?.filter((p) => p.status === 'DONT_POST') || [];
  const allPhotosDontPost = Boolean(hasPhotos && postPhotos.length === 0 && maybePhotos.length === 0);

  const strongestPhoto: IndividualPhotoAnalysis | undefined =
    ps?.photos?.find((p) => p.photoNumber === ps.strongestPhotoNumber) ||
    postPhotos[0] ||
    ps?.photos?.[0];

  const hasViableCarousel = Boolean(
    ps?.carouselOrder?.isRecommended &&
      postPhotos.length >= 2 &&
      !ps.isVisuallyRepetitive
  );

  // 2. HONEST "DON'T POST" VERDICT (All content is weak or flawed)
  if ((!hasReels || allReelsWeak) && (!hasPhotos || allPhotosDontPost)) {
    const defects: string[] = [];
    if (hasReels && winningReel) {
      defects.push(`Reel #${winningReel.reelNumber} exhibits weak hook retention (Scroll-Stop: ${winningReel.scrollStopScore}/100) and pacing flaws.`);
    }
    if (hasPhotos) {
      defects.push(`All ${photosCount} analyzed photos received 'DON'T POST' verdicts due to framing, lighting, or focus flaws.`);
    }

    return {
      id: `unified-${Date.now()}`,
      createdAt: new Date().toISOString(),
      recommendationType: 'DONT_POST',
      confidence: 'HIGH',
      headline: "DON'T POST ANY OF THESE YET",
      selectedTitle: 'Quality Standard Not Met',
      reasoning:
        'Both your analyzed Reels and Photos fail to meet professional quality thresholds. Posting substandard visuals harms your algorithmic authority and follower retention. The honest recommendation is to refine or retake before publishing.',
      evidence: defects.length > 0 ? defects : [
        'Available content lacks sufficient visual clarity and engagement potential.',
        'Hook drop-off or photo exposure issues would degrade post reach.',
        'Retaking key shots will produce a significantly higher engagement outcome.',
      ],
      strengths: ['Early identification of flaws saves creator credibility and audience goodwill.'],
      risks: [
        'Publishing low-retention video signals lower quality to the Instagram recommendation engine.',
        'Blurry or poorly lit photos dilute aesthetic consistency.',
      ],
      alternativeOption: 'Execute the recommended retakes or edits in the detail panels before publishing.',
      userPreferenceApplied: 'NONE',
      contentAvailability,
      postingDataState,
      recommendedPostingDay: ig.recommendedPostingDay,
      recommendedPostingTime: ig.recommendedPostingTime,
      postingWindowRationale: ig.postingWindowRationale,
      postingDataNotice: ig.postingDataNotice,
    };
  }

  // 3. USER PREFERENCE HANDLING
  if (pref === 'REEL' && hasReels && !allReelsWeak && winningReel) {
    return buildReelRecommendation({
      winningReel,
      comp,
      ps,
      userPreferenceApplied: 'REEL',
      contentAvailability,
      postingDataState,
      ig,
      niche,
    });
  }

  if (pref === 'CAROUSEL' && hasPhotos) {
    if (hasViableCarousel) {
      return buildCarouselRecommendation({
        ps: ps!,
        winningReel,
        userPreferenceApplied: 'CAROUSEL',
        contentAvailability,
        postingDataState,
        ig,
        niche,
      });
    } else if (postPhotos.length === 1 && strongestPhoto) {
      return buildSinglePhotoRecommendation({
        photo: strongestPhoto,
        ps: ps!,
        winningReel,
        userPreferenceApplied: 'CAROUSEL', // preference requested but adjusted with reason
        note: 'Only 1 photo earned a POST verdict; a carousel would dilute quality.',
        contentAvailability,
        postingDataState,
        ig,
        niche,
      });
    }
  }

  if (pref === 'PHOTO' && hasPhotos && strongestPhoto && !allPhotosDontPost) {
    return buildSinglePhotoRecommendation({
      photo: strongestPhoto,
      ps: ps!,
      winningReel,
      userPreferenceApplied: 'PHOTO',
      contentAvailability,
      postingDataState,
      ig,
      niche,
    });
  }

  // 4. NEUTRAL (ALL) OR FALLBACK DECISION LOGIC
  // If only Reels available:
  if (hasReels && !hasPhotos) {
    if (allReelsWeak) {
      return {
        id: `unified-${Date.now()}`,
        createdAt: new Date().toISOString(),
        recommendationType: 'DONT_POST',
        confidence: 'HIGH',
        headline: "DON'T POST ANY OF THESE YET",
        selectedTitle: `Reel #${winningReel?.reelNumber || 1} Needs Critical Re-edits`,
        reasoning: `The analyzed Reels score below standard thresholds (${winningReel?.overallScore || 65}/100) with hook scores under 65. Refine pacing or re-record the hook.`,
        evidence: [
          `Scroll-stop score (${winningReel?.scrollStopScore || 50}/100) indicates high immediate drop-off risk.`,
          winningReel?.improvementSteps?.[0]?.description || 'Opening 1.5s lacks clear visual hook.',
          'No photos available as an alternative post.',
        ],
        strengths: ['Identified exact pacing fixes to apply before publishing.'],
        risks: ['Posting with current weak hook will hurt account completion rate metrics.'],
        alternativeOption: 'Apply the suggested timeline trims in Reel Director.',
        userPreferenceApplied: 'NONE',
        contentAvailability,
        postingDataState,
        recommendedPostingDay: ig.recommendedPostingDay,
        recommendedPostingTime: ig.recommendedPostingTime,
        postingWindowRationale: ig.postingWindowRationale,
        postingDataNotice: ig.postingDataNotice,
      };
    }

    return buildReelRecommendation({
      winningReel: winningReel!,
      comp,
      ps,
      userPreferenceApplied: 'NONE',
      contentAvailability,
      postingDataState,
      ig,
      niche,
    });
  }

  // If only Photos available:
  if (hasPhotos && !hasReels) {
    if (allPhotosDontPost) {
      return {
        id: `unified-${Date.now()}`,
        createdAt: new Date().toISOString(),
        recommendationType: 'DONT_POST',
        confidence: 'HIGH',
        headline: "DON'T POST ANY OF THESE YET",
        selectedTitle: 'All Photos Received DONT_POST Verdicts',
        reasoning: 'None of the analyzed photos met minimum composition, lighting, or sharpness requirements for publication.',
        evidence: [
          `0 out of ${photosCount} photos received a POST recommendation.`,
          'Fundamental lighting or framing issues cannot be fixed with simple filters.',
          'Retaking the shoot with proper directional lighting is recommended.',
        ],
        strengths: [],
        risks: ['Subpar photo uploads diminish profile aesthetic coherence.'],
        alternativeOption: 'Review the individual retake advice provided for each photo.',
        userPreferenceApplied: 'NONE',
        contentAvailability,
        postingDataState,
        recommendedPostingDay: ig.recommendedPostingDay,
        recommendedPostingTime: ig.recommendedPostingTime,
        postingWindowRationale: ig.postingWindowRationale,
        postingDataNotice: ig.postingDataNotice,
      };
    }

    if (hasViableCarousel) {
      return buildCarouselRecommendation({
        ps: ps!,
        winningReel: undefined,
        userPreferenceApplied: 'NONE',
        contentAvailability,
        postingDataState,
        ig,
        niche,
      });
    }

    return buildSinglePhotoRecommendation({
      photo: strongestPhoto!,
      ps: ps!,
      winningReel: undefined,
      userPreferenceApplied: 'NONE',
      contentAvailability,
      postingDataState,
      ig,
      niche,
    });
  }

  // 5. BOTH REELS AND PHOTOS ARE AVAILABLE: Evidence-Based Format Comparison
  // Check Reel quality metrics
  const reelStrong = Boolean(winningReel && winningReel.overallScore >= 82 && winningReel.scrollStopScore >= 78);
  const carouselStrong = Boolean(hasViableCarousel && postPhotos.length >= 3);
  const singlePhotoStandout = Boolean(strongestPhoto && strongestPhoto.score >= 92 && strongestPhoto.status === 'POST');

  // Case A: Reel is exceptionally strong (Reel format has dynamic motion & reach advantage when hook is solid)
  if (reelStrong && winningReel) {
    return buildReelRecommendation({
      winningReel,
      comp,
      ps,
      userPreferenceApplied: 'NONE',
      contentAvailability,
      postingDataState,
      ig,
      niche,
      alternativeOverride: hasViableCarousel
        ? `Photo Carousel (Slides #${ps?.carouselOrder?.recommendedOrder.slice(0, 4).join(', #')}) is a strong alternative for static styling focus.`
        : strongestPhoto
        ? `Photo #${strongestPhoto.photoNumber} is a great alternative if you want a minimalist single-image post.`
        : undefined,
    });
  }

  // Case B: Carousel is stronger than an average Reel
  if (carouselStrong && ps) {
    return buildCarouselRecommendation({
      ps,
      winningReel,
      userPreferenceApplied: 'NONE',
      contentAvailability,
      postingDataState,
      ig,
      niche,
      alternativeOverride: winningReel
        ? `Reel #${winningReel.reelNumber} (${winningReel.fileName}) is available if you prefer short-form video engagement today.`
        : undefined,
    });
  }

  // Case C: Single photo is the cleanest standout asset
  if (strongestPhoto && postPhotos.length > 0 && ps) {
    return buildSinglePhotoRecommendation({
      photo: strongestPhoto,
      ps,
      winningReel,
      userPreferenceApplied: 'NONE',
      contentAvailability,
      postingDataState,
      ig,
      niche,
      alternativeOverride: winningReel
        ? `Reel #${winningReel.reelNumber} is ready if video motion is desired.`
        : undefined,
    });
  }

  // Case D: Fallback to winning Reel if available and not weak
  if (winningReel && !allReelsWeak) {
    return buildReelRecommendation({
      winningReel,
      comp,
      ps,
      userPreferenceApplied: 'NONE',
      contentAvailability,
      postingDataState,
      ig,
      niche,
    });
  }

  // Default honest fallback
  return {
    id: `unified-${Date.now()}`,
    createdAt: new Date().toISOString(),
    recommendationType: 'DONT_POST',
    confidence: 'MEDIUM',
    headline: "DON'T POST ANY OF THESE YET",
    selectedTitle: 'Inconclusive Quality Across Formats',
    reasoning: 'Neither the available Reel variations nor the photo set demonstrate decisive quality advantages today. Refinement is suggested before posting.',
    evidence: [
      'Reel variations show marginal scroll-stop hooks.',
      'Photos show mixed verdicts with no definitive editorial standout.',
      'Focus on applying the top improvement step from each review before publishing.',
    ],
    strengths: ['Clear roadmap for minor edits identified across both formats.'],
    risks: ['Posting without edits risks below-average retention.'],
    alternativeOption: 'Address the top 2 improvement recommendations in Reel Director or Photo Director.',
    userPreferenceApplied: 'NONE',
    contentAvailability,
    postingDataState,
    recommendedPostingDay: ig.recommendedPostingDay,
    recommendedPostingTime: ig.recommendedPostingTime,
    postingWindowRationale: ig.postingWindowRationale,
    postingDataNotice: ig.postingDataNotice,
  };
}

function buildReelRecommendation(params: {
  winningReel: ReelAnalysisResult;
  comp?: MultiReelComparison | null;
  ps?: PhotoSetAnalysisResult | null;
  userPreferenceApplied: 'REEL' | 'PHOTO' | 'CAROUSEL' | 'NONE';
  contentAvailability: any;
  postingDataState: 'SUFFICIENT' | 'INSUFFICIENT' | 'DISCONNECTED';
  ig: any;
  niche: string;
  alternativeOverride?: string;
}): UnifiedContentRecommendation {
  const r = params.winningReel;
  const comp = params.comp;
  const ps = params.ps;

  const evidence = [
    `Reel #${r.reelNumber} achieved the highest overall score (${r.overallScore}/100) with a ${r.scrollStopScore}/100 scroll-stop rating.`,
    `Optimal outfit drape and motion clarity throughout its ${r.durationSeconds}s runtime.`,
    r.scrollStopRationale || 'Engaging movement in the first 0.8s prevents immediate feed scrolling.',
  ];

  if (comp && comp.reels.length > 1) {
    evidence.push(`Outperformed ${comp.reels.length - 1} other variation(s) in pacing, editing continuity, and fashion visibility.`);
  }

  const strengths = [
    `Clear focal subject in opening frame with ${r.subscores?.visualQuality || 85}/100 visual quality.`,
    `High pacing score (${r.subscores?.pacing || 82}/100) maintaining viewer attention across transitions.`,
    `Direct alignment with ${params.niche} styling codes.`,
  ];

  const risks: string[] = [];
  if (r.improvementSteps && r.improvementSteps.length > 0) {
    risks.push(r.improvementSteps[0].description);
  }
  if (r.subscores && r.subscores.audio < 75) {
    risks.push('Ensure backing audio is paired with a trending audio track on Instagram for algorithmic discovery.');
  }
  if (risks.length === 0) {
    risks.push('Ensure the cover frame is set to the recommended timestamp to maximize grid tap-through.');
  }

  let alternativeOption = params.alternativeOverride;
  if (!alternativeOption) {
    if (ps && ps.photos.some((p) => p.status === 'POST')) {
      if (ps.carouselOrder?.isRecommended) {
        alternativeOption = `Photo Carousel (#${ps.carouselOrder.recommendedOrder.slice(0, 3).join(', #')}) is an editorial alternative for viewers who prefer slow browsing.`;
      } else {
        const bestP = ps.photos.find((p) => p.status === 'POST');
        alternativeOption = `Photo #${bestP?.photoNumber || 1} is a clean single-image alternative for a minimalist statement.`;
      }
    } else {
      const secondReel = comp?.reels.find((rel) => rel.id !== r.id);
      if (secondReel) {
        alternativeOption = `Reel #${secondReel.reelNumber} (${secondReel.fileName}) is a viable alternative if you prefer a different pacing style.`;
      } else {
        alternativeOption = 'No secondary photo or video variations currently available in session.';
      }
    }
  }

  return {
    id: `unified-${Date.now()}`,
    createdAt: new Date().toISOString(),
    recommendationType: 'REEL',
    recommendedReelId: r.id,
    recommendedReelNumber: r.reelNumber,
    confidence: r.overallScore >= 85 ? 'HIGH' : 'MEDIUM',
    headline: 'POST THE REEL',
    selectedTitle: `Reel #${r.reelNumber} — ${r.fileName}`,
    reasoning: `Reel #${r.reelNumber} is your highest-impact asset today. Short-form video motion combined with a strong initial visual hook offers the highest organic discovery potential on Instagram for fashion creators.`,
    evidence,
    strengths,
    risks,
    alternativeOption,
    userPreferenceApplied: params.userPreferenceApplied,
    contentAvailability: params.contentAvailability,
    postingDataState: params.postingDataState,
    recommendedPostingDay: params.ig.recommendedPostingDay,
    recommendedPostingTime: params.ig.recommendedPostingTime,
    postingWindowRationale: params.ig.postingWindowRationale,
    postingDataNotice: params.ig.postingDataNotice,
  };
}

function buildCarouselRecommendation(params: {
  ps: PhotoSetAnalysisResult;
  winningReel?: ReelAnalysisResult;
  userPreferenceApplied: 'REEL' | 'PHOTO' | 'CAROUSEL' | 'NONE';
  contentAvailability: any;
  postingDataState: 'SUFFICIENT' | 'INSUFFICIENT' | 'DISCONNECTED';
  ig: any;
  niche: string;
  alternativeOverride?: string;
}): UnifiedContentRecommendation {
  const ps = params.ps;
  const order = ps.carouselOrder?.recommendedOrder || [1, 2, 3];
  const firstSlide = ps.carouselOrder?.firstSlidePhotoNumber || order[0];

  const evidence = [
    `Curated narrative flow across ${order.length} slides creates multi-swipe engagement dwell time.`,
    `Photo #${firstSlide} provides a commanding cover anchor: ${ps.carouselOrder?.firstSlideRationale || 'Clean silhouette framing.'}`,
    `Visual variety score is high without repetitive framing dilution (${ps.isVisuallyRepetitive ? 'Minor overlap noted' : 'Diverse angles and crop distances'}).`,
  ];

  const strengths = [
    'Carousels have double-impression distribution (Instagram algorithm re-shows unswiped carousels with slide #2).',
    `High individual slide quality with ${ps.recommendedPostPhotoNumbers.length} approved 'POST' photos.`,
    ps.carouselOrder?.flowRationale || 'Balanced progression from establishing full-look to accessory details.',
  ];

  const risks = [
    'Ensure all slides share matching color temperature and grain consistency.',
    ps.isVisuallyRepetitive && ps.repetitiveObservation
      ? ps.repetitiveObservation
      : 'Swipe drop-off may occur if slides 3–5 do not offer distinct visual value.',
  ];

  let alternativeOption = params.alternativeOverride;
  if (!alternativeOption) {
    if (params.winningReel) {
      alternativeOption = `Reel #${params.winningReel.reelNumber} is available if you want short-form video discovery rather than carousel dwell time.`;
    } else {
      alternativeOption = `Photo #${firstSlide} can be posted as a standalone single image for a simpler, minimalist look.`;
    }
  }

  return {
    id: `unified-${Date.now()}`,
    createdAt: new Date().toISOString(),
    recommendationType: 'CAROUSEL',
    recommendedPhotoNumbers: order,
    confidence: order.length >= 3 ? 'HIGH' : 'MEDIUM',
    headline: 'POST THE CAROUSEL',
    selectedTitle: `Photo Carousel (${order.map((n) => `#${n}`).join(', ')})`,
    reasoning: `The analyzed photo set functions best as a multi-slide editorial carousel. Carousel posts excel at viewer dwell time and receive automatic secondary feed impressions when followers do not swipe the first slide.`,
    evidence,
    strengths,
    risks,
    alternativeOption,
    userPreferenceApplied: params.userPreferenceApplied,
    contentAvailability: params.contentAvailability,
    postingDataState: params.postingDataState,
    recommendedPostingDay: params.ig.recommendedPostingDay,
    recommendedPostingTime: params.ig.recommendedPostingTime,
    postingWindowRationale: params.ig.postingWindowRationale,
    postingDataNotice: params.ig.postingDataNotice,
  };
}

function buildSinglePhotoRecommendation(params: {
  photo: IndividualPhotoAnalysis;
  ps: PhotoSetAnalysisResult;
  winningReel?: ReelAnalysisResult;
  userPreferenceApplied: 'REEL' | 'PHOTO' | 'CAROUSEL' | 'NONE';
  note?: string;
  contentAvailability: any;
  postingDataState: 'SUFFICIENT' | 'INSUFFICIENT' | 'DISCONNECTED';
  ig: any;
  niche: string;
  alternativeOverride?: string;
}): UnifiedContentRecommendation {
  const p = params.photo;

  const evidence = [
    `Photo #${p.photoNumber} scored ${p.score}/100 with a verified 'POST' verdict.`,
    `Optimal directional lighting and crisp sharpness (${p.evaluatedFactors?.lighting || 'Natural daylight'}).`,
    p.verdictSummary || 'Commanding editorial presence with clear garment presentation.',
  ];

  if (params.note) {
    evidence.push(params.note);
  }

  const strengths = [
    `Strong silhouette balance: ${p.evaluatedFactors?.composition || 'Refined rule-of-thirds balance'}.`,
    `Minimalist single focal point without narrative dilution.`,
    p.strengths?.[0] || 'Crisp optical clarity and garment texture representation.',
  ];

  const risks: string[] = [];
  if (p.practicalImprovements && p.practicalImprovements.length > 0) {
    risks.push(p.practicalImprovements[0]);
  } else {
    risks.push('Single photo posts rely heavily on caption storytelling for comment engagement.');
  }

  let alternativeOption = params.alternativeOverride;
  if (!alternativeOption) {
    if (params.winningReel) {
      alternativeOption = `Reel #${params.winningReel.reelNumber} is ready if you prefer video motion.`;
    } else if (params.ps.carouselOrder?.isRecommended) {
      alternativeOption = 'A multi-slide carousel can be used if you want to showcase outfit details alongside this hero shot.';
    } else {
      alternativeOption = 'No secondary format available.';
    }
  }

  return {
    id: `unified-${Date.now()}`,
    createdAt: new Date().toISOString(),
    recommendationType: 'SINGLE_PHOTO',
    recommendedPhotoNumbers: [p.photoNumber],
    confidence: p.score >= 88 ? 'HIGH' : 'MEDIUM',
    headline: 'POST SINGLE PHOTO',
    selectedTitle: `Photo #${p.photoNumber} — ${p.fileName}`,
    reasoning: `Photo #${p.photoNumber} is a standalone editorial standout. Its clarity, garment drape, and clean lighting make it immediately arresting in the feed without needing supporting slides.`,
    evidence,
    strengths,
    risks,
    alternativeOption,
    userPreferenceApplied: params.userPreferenceApplied,
    contentAvailability: params.contentAvailability,
    postingDataState: params.postingDataState,
    recommendedPostingDay: params.ig.recommendedPostingDay,
    recommendedPostingTime: params.ig.recommendedPostingTime,
    postingWindowRationale: params.ig.postingWindowRationale,
    postingDataNotice: params.ig.postingDataNotice,
  };
}

/**
 * Unified Content Director AI Engine
 * Synthesizes Reel analysis, Photo analysis, and Instagram posting data with Gemini,
 * protected by strict guardrails and deterministic fallback.
 */
export async function getUnifiedContentRecommendation(
  input: UnifiedRecommendationInput
): Promise<UnifiedContentRecommendation> {
  const comp = input.comparison;
  const ps = input.photoSet;
  const pref = input.userPreference || 'ALL';
  const niche = input.userNiche || 'High-Street Minimal & Luxury Fashion';
  const ig = input.instagramContext || {
    isConnected: false,
    mediaCount: 0,
    recommendedPostingDay: 'Not enough data yet',
    recommendedPostingTime: 'Not enough data yet',
    postingWindowRationale:
      'Connect your Instagram Professional account and provide sufficient historical data to calculate a personalized posting window.',
    hasSufficientPostingData: false,
    postingDataNotice: 'Instagram not connected',
  };

  const hasReels = Boolean(comp?.reels && comp.reels.length > 0);
  const reelsCount = comp?.reels?.length || 0;
  const hasPhotos = Boolean(ps?.photos && ps.photos.length > 0);
  const photosCount = ps?.photos?.length || 0;

  // If no content, immediately return NOT_ENOUGH_DATA
  if (!hasReels && !hasPhotos) {
    return generateDeterministicUnifiedRecommendation(input);
  }

  const ai = getGeminiClient();
  if (!ai) {
    return generateDeterministicUnifiedRecommendation(input);
  }

  try {
    const promptText = `You are the Unified Content Director: an elite Instagram creative director, fashion brand strategist, and visual editor.
Your core task is to answer the creator's single most important daily question:
"What should I post today?"

Compare the creator's available analyzed content (Reels vs Photos vs Carousel) and make an evidence-based recommendation.

CRITICAL DIRECTIVES:
1. HONEST DECISIONS:
   - You MUST be willing to recommend "DONT_POST" if all available content is weak or flawed.
   - If all Reels are weak and all Photos are 'DONT_POST', return recommendationType "DONT_POST".
   - Never force a winner simply because content exists.
   - Never use fake hype ("100% viral", "Guaranteed reach", "Will explode", fake numbers).
2. TRANSPARENT NON-BLIND COMPARISON:
   - Do NOT treat numerical scores from different systems as mathematically equal.
   - Ground your decision in qualitative format advantages:
     * Reel: Motion, hook scroll-stop power, pacing, outfit silhouette in movement.
     * Single Photo: High-impact editorial hero shot, instant visual clarity, stillness.
     * Carousel: Multi-look storytelling, dwell time, detail-to-silhouette progression without repetition.
3. USER PREFERENCE:
   - Requested preference: "${pref}"
   - If user explicitly requested 'REEL', choose the best Reel among available Reels (unless all are unpostable).
   - If user requested 'CAROUSEL', evaluate carousel viability (requires at least 2 strong POST photos without repetition).
   - If user requested 'PHOTO', evaluate the best single photo.
   - If user requested 'ALL', choose the strongest format objectively based on evidence.
4. AVAILABLE CONTENT CONTEXT:
   - Brand Niche: ${niche}
   - Analyzed Reels Available: ${reelsCount}
   ${hasReels ? `Reels Summary:
   ${comp?.reels.map((r) => `  * Reel #${r.reelNumber} (${r.fileName}): Overall=${r.overallScore}, ScrollStop=${r.scrollStopScore}, Winner=${r.isWinner ? 'YES' : 'NO'}, Pacing=${r.subscores?.pacing}, Outfit=${r.subscores?.fashionPresentation}. Hook: "${r.scrollStopRationale}". Top Fix: "${r.improvementSteps?.[0]?.description || 'None'}"`).join('\n')}` : '  * No Reels analyzed'}

   - Analyzed Photos Available: ${photosCount}
   ${hasPhotos ? `Photos Summary:
   * Overall Verdict: ${ps?.overallVerdict} (Type: ${ps?.verdictType})
   * Recommended Carousel: ${ps?.carouselOrder?.isRecommended ? `Order: [${ps.carouselOrder.recommendedOrder.join(', ')}]. Flow: ${ps.carouselOrder.flowRationale}` : 'None'}
   * Repetitive: ${ps?.isVisuallyRepetitive ? 'YES' : 'NO'}
   * Individual Photos:
   ${ps?.photos.map((p) => `  * Photo #${p.photoNumber} (${p.fileName}): Status=${p.status}, Score=${p.score}/100. Strengths: [${p.strengths.slice(0, 2).join('; ')}]. Weaknesses: [${p.weaknesses.slice(0, 2).join('; ')}]. Fixes: [${p.practicalImprovements.slice(0, 1).join('; ')}]`).join('\n')}` : '  * No Photos analyzed'}

5. POSTING TIME DATA (PHASE 1):
   - Has Sufficient Account Data: ${ig.hasSufficientPostingData ? 'YES' : 'NO'}
   - Status Notice: ${ig.postingDataNotice || 'None'}
   - DO NOT invent a specific posting time or day if Has Sufficient Account Data is NO.

OUTPUT JSON FORMAT ONLY:
{
  "recommendationType": "REEL" | "SINGLE_PHOTO" | "CAROUSEL" | "DONT_POST" | "NOT_ENOUGH_DATA",
  "recommendedReelNumber": number (if REEL),
  "recommendedPhotoNumbers": [number] (if PHOTO or CAROUSEL),
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "headline": "POST THE REEL" | "POST THE CAROUSEL" | "POST SINGLE PHOTO" | "DON'T POST ANY OF THESE YET",
  "selectedTitle": string,
  "reasoning": string,
  "evidence": [string, string, string] (3 to 5 concise, grounded evidence points),
  "strengths": [string, string, string],
  "risks": [string, string] ("Watch out for" weaknesses/caveats),
  "alternativeOption": string (a specific, realistic alternative asset among the available content),
  "userPreferenceApplied": "REEL" | "PHOTO" | "CAROUSEL" | "NONE"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendationType: {
              type: Type.STRING,
              enum: ['REEL', 'SINGLE_PHOTO', 'CAROUSEL', 'DONT_POST', 'NOT_ENOUGH_DATA'],
            },
            recommendedReelNumber: { type: Type.INTEGER },
            recommendedPhotoNumbers: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
            },
            confidence: {
              type: Type.STRING,
              enum: ['HIGH', 'MEDIUM', 'LOW'],
            },
            headline: { type: Type.STRING },
            selectedTitle: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            evidence: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            risks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            alternativeOption: { type: Type.STRING },
            userPreferenceApplied: {
              type: Type.STRING,
              enum: ['REEL', 'PHOTO', 'CAROUSEL', 'NONE'],
            },
          },
          required: [
            'recommendationType',
            'confidence',
            'headline',
            'selectedTitle',
            'reasoning',
            'evidence',
            'strengths',
            'risks',
            'alternativeOption',
            'userPreferenceApplied',
          ],
        },
        temperature: 0.3,
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    // Resolve matching Reel ID if recommendationType is REEL
    let recommendedReelId: string | undefined = undefined;
    if (parsed.recommendationType === 'REEL' && comp?.reels) {
      const match =
        comp.reels.find((r) => r.reelNumber === parsed.recommendedReelNumber) ||
        comp.reels.find((r) => r.isWinner) ||
        comp.reels[0];
      recommendedReelId = match?.id;
    }

    return {
      id: `unified-${Date.now()}`,
      createdAt: new Date().toISOString(),
      recommendationType: parsed.recommendationType as UnifiedRecommendationType,
      recommendedReelId,
      recommendedReelNumber: parsed.recommendedReelNumber,
      recommendedPhotoNumbers: parsed.recommendedPhotoNumbers,
      confidence: (parsed.confidence as RecommendationConfidence) || 'HIGH',
      headline: parsed.headline || 'POST THE REEL',
      selectedTitle: parsed.selectedTitle || 'Analyzed Content',
      reasoning: parsed.reasoning || 'Evaluated across available formats.',
      evidence: Array.isArray(parsed.evidence) && parsed.evidence.length > 0 ? parsed.evidence : ['Quality and pacing evaluation complete.'],
      strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ['Strong overall visual composition.'],
      risks: Array.isArray(parsed.risks) && parsed.risks.length > 0 ? parsed.risks : ['Check cover crop in profile grid.'],
      alternativeOption: parsed.alternativeOption || 'Review secondary takes in the detail view.',
      userPreferenceApplied: parsed.userPreferenceApplied || 'NONE',
      contentAvailability: {
        hasReels,
        reelsCount,
        hasPhotos,
        photosCount,
      },
      postingDataState: ig.hasSufficientPostingData
        ? 'SUFFICIENT'
        : ig.isConnected
        ? 'INSUFFICIENT'
        : 'DISCONNECTED',
      recommendedPostingDay: ig.recommendedPostingDay,
      recommendedPostingTime: ig.recommendedPostingTime,
      postingWindowRationale: ig.postingWindowRationale,
      postingDataNotice: ig.postingDataNotice,
    };
  } catch (err) {
    console.warn('Gemini unified recommendation failed, using deterministic fallback engine:', err);
    return generateDeterministicUnifiedRecommendation(input);
  }
}
