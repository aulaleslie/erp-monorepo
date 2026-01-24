import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export type ApprovalAction = 'approve' | 'reject' | 'request-revision';

interface ApprovalActionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (action: ApprovalAction, notes: string) => Promise<void>;
    action: ApprovalAction | null;
    documentNumber: string;
}

export function ApprovalActionDialog({
    isOpen,
    onClose,
    onConfirm,
    action,
    documentNumber,
}: ApprovalActionDialogProps) {
    const t = useTranslations('sales.approvals.actionDialog');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!action) return;
        setLoading(true);
        try {
            await onConfirm(action, notes);
            setNotes('');
            onClose();
        } catch (error) {
            // Error handling is usually done by the caller
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        if (!action) return '';
        return t(`title.${action}`, { number: documentNumber });
    };

    const getConfirmText = () => {
        if (!action) return '';
        return t(`buttons.${action}`);
    };

    const getVariant = () => {
        if (action === 'reject') return 'destructive';
        if (action === 'request-revision') return 'secondary';
        return 'default';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{getTitle()}</DialogTitle>
                    <DialogDescription>
                        {t(`description.${action}`)}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="notes">{t('labels.notes')}</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('placeholders.notes')}
                            className="h-24"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        {t('buttons.cancel')}
                    </Button>
                    <Button
                        variant={getVariant()}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {getConfirmText()}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
