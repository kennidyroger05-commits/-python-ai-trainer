"""Stable, non-sensitive errors for operator logs and portable reports."""
class ExecutorError(Exception):
    def __init__(self, code, *, retry_after=None):
        self.code=code
        self.retry_after=retry_after if type(retry_after) is int and 1<=retry_after<=300 else None
        super().__init__(code)
