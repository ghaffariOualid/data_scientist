#!/usr/bin/env python3
"""Patch for CrewAI signal issue on Windows"""
import signal
import sys

# Patch missing signals on Windows
if sys.platform == 'win32':
    # Windows doesn't have SIGHUP, SIGPIPE, SIGXFSZ, SIGVTALRM
    if not hasattr(signal, 'SIGHUP'):
        signal.SIGHUP = 1
    if not hasattr(signal, 'SIGPIPE'):
        signal.SIGPIPE = 13
    if not hasattr(signal, 'SIGXFSZ'):
        signal.SIGXFSZ = 25
    if not hasattr(signal, 'SIGVTALRM'):
        signal.SIGVTALRM = 26

print("Signal patch applied for Windows compatibility")
