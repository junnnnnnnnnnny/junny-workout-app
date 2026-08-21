import { cert, getApps, getApp, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function buildAdminApp(): App {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase admin credentials are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

function getAdminAuth() {
  return getAuth(buildAdminApp());
}

/** 서버(Vercel 환경변수)에 있는 실제 서비스 계정으로 Firestore에 보안규칙 우회 접근. */
export function getAdminFirestore() {
  return getFirestore(buildAdminApp());
}

/** Verifies the Firebase ID token from an Authorization: Bearer header. Throws if invalid/missing. */
export async function requireUserId(request: Request): Promise<string> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("Missing Authorization bearer token");

  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}
