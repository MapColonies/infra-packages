import 'reflect-metadata';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Tracer, SpanStatusCode, trace } from '@opentelemetry/api';
import { withSpanV4, withSpanAsyncV4 } from '../../src/decorators/v4';
import { setupTracing, teardownTracing, type TracingTestContext } from '../helpers/testSetup';

describe('v4 decorators', () => {
  let context: TracingTestContext;

  beforeEach(() => {
    context = setupTracing();
  });

  afterEach(() => {
    teardownTracing(context);
  });

  describe('withSpanV4', () => {
    it('should create a span for decorated method', () => {
      class TestClass {
        private readonly tracer: Tracer = trace.getTracer('test');

        @withSpanV4
        public testMethod(): string {
          return 'success';
        }
      }

      const instance = new TestClass();
      const result = instance.testMethod();

      expect(result).toBe('success');

      const spans = context.exporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0]!.name).toBe('testMethod');
      expect(spans[0]!.status.code).toBe(SpanStatusCode.OK);
    });

    it('should handle method with arguments', () => {
      class TestClass {
        private readonly tracer: Tracer = trace.getTracer('test');

        @withSpanV4
        public add(a: number, b: number): number {
          return a + b;
        }
      }

      const instance = new TestClass();
      const result = instance.add(5, 3);

      expect(result).toBe(8);

      const spans = context.exporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0]!.name).toBe('add');
    });

    it('should handle errors and record them in span', () => {
      class TestClass {
        private readonly tracer: Tracer = trace.getTracer('test');

        @withSpanV4
        public throwError(): void {
          throw new Error('test error');
        }
      }

      const instance = new TestClass();

      expect(() => instance.throwError()).toThrow('test error');

      const spans = context.exporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0]!.status.code).toBe(SpanStatusCode.ERROR);
      expect(spans[0]!.events).toHaveLength(1);
      expect(spans[0]!.events[0]!.name).toBe('exception');
    });

    it('should access class context correctly', () => {
      class TestClass {
        private readonly tracer: Tracer = trace.getTracer('test');
        private readonly value = 42;

        @withSpanV4
        public getValue(): number {
          return this.value;
        }
      }

      const instance = new TestClass();
      const result = instance.getValue();

      expect(result).toBe(42);
    });
  });

  describe('withSpanAsyncV4', () => {
    it('should create a span for decorated async method', async () => {
      class TestClass {
        private readonly tracer: Tracer = trace.getTracer('test');

        @withSpanAsyncV4
        public async testMethod(): Promise<string> {
          return Promise.resolve('success');
        }
      }

      const instance = new TestClass();
      const result = await instance.testMethod();

      expect(result).toBe('success');

      const spans = context.exporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0]!.name).toBe('testMethod');
      expect(spans[0]!.status.code).toBe(SpanStatusCode.OK);
    });

    it('should handle async method with arguments', async () => {
      class TestClass {
        private readonly tracer: Tracer = trace.getTracer('test');

        @withSpanAsyncV4
        public async multiply(a: number, b: number): Promise<number> {
          return Promise.resolve(a * b);
        }
      }

      const instance = new TestClass();
      const result = await instance.multiply(6, 7);

      expect(result).toBe(42);

      const spans = context.exporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0]!.name).toBe('multiply');
    });

    it('should handle async errors and record them in span', async () => {
      class TestClass {
        private readonly tracer: Tracer = trace.getTracer('test');

        @withSpanAsyncV4
        public async throwError(): Promise<void> {
          return Promise.reject(new Error('async test error'));
        }
      }

      const instance = new TestClass();

      await expect(instance.throwError()).rejects.toThrow('async test error');

      const spans = context.exporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0]!.status.code).toBe(SpanStatusCode.ERROR);
      expect(spans[0]!.events).toHaveLength(1);
      expect(spans[0]!.events[0]!.name).toBe('exception');
    });

    it('should access class context correctly', async () => {
      class TestClass {
        private readonly tracer: Tracer = trace.getTracer('test');
        private readonly value = 100;

        @withSpanAsyncV4
        public async getValue(): Promise<number> {
          return Promise.resolve(this.value);
        }
      }

      const instance = new TestClass();
      const result = await instance.getValue();

      expect(result).toBe(100);
    });
  });
});
