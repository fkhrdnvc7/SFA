import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Send, Webhook, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const TelegramSettings = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [settingWebhook, setSettingWebhook] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [botToken, setBotToken] = useState("");
  const [adminChatId, setAdminChatId] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [dailyReportTime, setDailyReportTime] = useState("08:00");
  const [isActive, setIsActive] = useState(true);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && profile.role === "ADMIN") {
      fetchSettings();
    } else if (profile) {
      navigate("/dashboard");
    }
  }, [user, profile, loading, navigate]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("telegram_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettingsId(data.id);
        setBotToken(data.bot_token);
        setAdminChatId(data.admin_chat_id);
        setWebhookSecret(data.webhook_secret || "");
        setDailyReportTime((data.daily_report_time || "08:00:00").slice(0, 5));
        setIsActive(data.is_active ?? true);
      }
    } catch {
      toast.error("Sozlamalarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botToken.trim() || !adminChatId.trim()) {
      toast.error("Bot token va Admin Chat ID majburiy");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        bot_token: botToken.trim(),
        admin_chat_id: adminChatId.trim(),
        webhook_secret: webhookSecret.trim() || null,
        daily_report_time: `${dailyReportTime}:00`,
        is_active: isActive,
      };

      if (settingsId) {
        const { error } = await supabase
          .from("telegram_settings")
          .update(payload)
          .eq("id", settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("telegram_settings")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        setSettingsId(data.id);
      }

      toast.success("Sozlamalar saqlandi");
    } catch {
      toast.error("Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handleSendReport = async () => {
    setSendingReport(true);
    try {
      const { error } = await supabase.functions.invoke("smart-task");
      if (error) throw error;
      toast.success("Hisobot yuborildi");
    } catch {
      toast.error("Hisobot yuborishda xatolik. Edge Function deploy qilinganligini tekshiring.");
    } finally {
      setSendingReport(false);
    }
  };

  const handleSetWebhook = async () => {
    if (!botToken.trim()) {
      toast.error("Avval bot token kiriting va saqlang");
      return;
    }

    setSettingWebhook(true);
    try {
      const webhookUrl = `${supabaseUrl}/functions/v1/hyper-action`;
      const response = await fetch(
        `https://api.telegram.org/bot${botToken.trim()}/setWebhook`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: webhookUrl,
            secret_token: webhookSecret.trim() || undefined,
          }),
        },
      );
      const result = await response.json();
      if (!result.ok) throw new Error(result.description || "Webhook o'rnatilmadi");
      toast.success("Webhook muvaffaqiyatli o'rnatildi");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Webhook o'rnatishda xatolik";
      toast.error(message);
    } finally {
      setSettingWebhook(false);
    }
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <Skeleton className="h-96 w-full max-w-2xl" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Telegram sozlamalari</h1>
          <p className="text-muted-foreground">Bot va kunlik hisobot sozlamalari</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bot konfiguratsiyasi</CardTitle>
            <CardDescription>
              Telegram bot orqali kunlik hisobotlar va statistika olish
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Bot Token *</Label>
                <Input
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="123456789:ABCdefGHI..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Admin Chat ID *</Label>
                <Input
                  value={adminChatId}
                  onChange={(e) => setAdminChatId(e.target.value)}
                  placeholder="-1001234567890"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Webhook Secret</Label>
                <Input
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="Maxfiy kalit (ixtiyoriy)"
                />
              </div>
              <div className="space-y-2">
                <Label>Kunlik hisobot vaqti</Label>
                <Input
                  type="time"
                  value={dailyReportTime}
                  onChange={(e) => setDailyReportTime(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Aktiv</Label>
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Saqlash
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amallar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleSendReport}
              disabled={sendingReport || !isActive}
              className="flex-1"
            >
              {sendingReport ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Hisobot yuborish
            </Button>
            <Button
              variant="outline"
              onClick={handleSetWebhook}
              disabled={settingWebhook}
              className="flex-1"
            >
              {settingWebhook ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Webhook className="mr-2 h-4 w-4" />
              )}
              Webhook o'rnatish
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TelegramSettings;
