---
name: docker-troubleshoot
description: Diagnose and fix Docker container issues including startup failures, networking problems, volume mounting errors, and service connectivity. Use when containers won't start, services can't connect, or Docker commands fail. Includes Supabase-specific container debugging.
allowed-tools: Bash, Read, Grep
---

# Docker Troubleshooting

Helps diagnose and resolve Docker-related issues.

## Instructions

### Initial Diagnostics

1. **Check Container Status**
   ```bash
   docker compose ps
   docker ps -a
   ```

2. **Review Logs**
   ```bash
   docker compose logs [service-name]
   docker compose logs --tail=50 --follow
   ```

3. **Inspect Container Health**
   ```bash
   docker inspect [container-name]
   docker stats [container-name]
   ```

### Common Issues and Solutions

#### Containers Won't Start

**Symptoms**: Container exits immediately or stays in "Restarting" state

**Diagnosis Steps**:
1. Check logs: `docker compose logs [service]`
2. Verify port conflicts: `docker compose ps` and `netstat -tlnp`
3. Check disk space: `df -h`
4. Verify configuration: `docker compose config`

**Common Fixes**:
- Port already in use: Change ports in docker compose.yml
- Permission issues: `chmod` appropriate files/directories
- Missing environment variables: Check .env file
- Corrupt volumes: `docker compose down -v` and rebuild

#### Network Connectivity Issues

**Symptoms**: Services can't communicate, connection refused errors

**Diagnosis Steps**:
1. Check network: `docker network ls` and `docker network inspect`
2. Test connectivity: `docker exec [container] ping [other-service]`
3. Verify DNS: `docker exec [container] nslookup [service-name]`

**Common Fixes**:
- Use service names (not localhost) for inter-container communication
- Ensure services are on same network
- Check firewall rules
- Restart Docker daemon if needed

#### Database Connection Failures

**Symptoms**: "Connection refused" or "Can't connect to database"

**Diagnosis Steps**:
1. Check DB container: `docker compose logs supabase-db`
2. Verify credentials in .env
3. Test connection: `docker exec -it [db-container] psql -U postgres`
4. Check port mapping: `docker compose ps supabase-db`

**Common Fixes**:
- Wait for DB to fully initialize (check logs)
- Verify DATABASE_URL format
- Check password/username in .env
- Ensure DB container is healthy before app starts

#### Volume Mount Issues

**Symptoms**: Data not persisting, permission denied errors

**Diagnosis Steps**:
1. Inspect volumes: `docker volume ls` and `docker volume inspect`
2. Check mount points: `docker inspect [container]`
3. Verify file permissions: `ls -la` on host

**Common Fixes**:
- Fix permissions: `chown -R user:group directory`
- Remove and recreate volumes: `docker compose down -v`
- Check volume paths in docker compose.yml
- Ensure host directories exist

#### Build Failures

**Symptoms**: "failed to build" or image errors

**Diagnosis Steps**:
1. Check build logs: `docker compose build [service]`
2. Verify Dockerfile syntax
3. Check base image availability
4. Review .dockerignore

**Common Fixes**:
- Clear build cache: `docker compose build --no-cache`
- Update base images: `docker compose pull`
- Fix Dockerfile syntax errors
- Check network connectivity for downloads

### Supabase-Specific Issues

#### Supabase Services Won't Start

**Check These Services**:
- `supabase-db` - PostgreSQL database
- `supabase-auth` - Authentication service
- `supabase-rest` - PostgREST API
- `supabase-realtime` - Realtime subscriptions
- `supabase-storage` - Storage service

**Common Issues**:
```bash
# DB not ready
docker compose logs supabase-db | grep "ready to accept"

# Auth service errors
docker compose logs supabase-auth | grep -i error

# API connection issues
docker compose logs supabase-rest
```

#### Reset Supabase Stack

**Development Reset** (loses data):
```bash
docker compose down -v
docker compose up -d
npx supabase db reset
```

**Soft Reset** (keeps data):
```bash
docker compose restart
```

### Performance Issues

**Symptoms**: Slow container response, high CPU/memory usage

**Diagnosis**:
```bash
docker stats
docker compose top
```

**Solutions**:
- Increase resource limits in docker compose.yml
- Optimize queries/code causing high load
- Check for memory leaks in logs
- Consider horizontal scaling

### Clean Up Commands

**Remove stopped containers**:
```bash
docker container prune
```

**Remove unused images**:
```bash
docker image prune -a
```

**Remove unused volumes** (CAUTION: loses data):
```bash
docker volume prune
```

**Complete cleanup** (CAUTION: removes everything):
```bash
docker compose down -v --rmi all
```

## Troubleshooting Workflow

1. **Identify the Problem**
   - What error message do you see?
   - Which service is affected?
   - When did it start happening?

2. **Gather Information**
   - Check container status
   - Review logs
   - Inspect configuration

3. **Test Hypothesis**
   - Try the most likely fix
   - Document what you tried
   - Check if issue persists

4. **Escalate if Needed**
   - Provide error logs
   - Document steps taken
   - Note environment details

## Examples

**User says**: "Docker containers keep crashing"

I will:
1. Run `docker compose ps` to check status
2. Review logs with `docker compose logs`
3. Identify which service is failing
4. Check for common issues (ports, permissions, resources)
5. Suggest specific fixes based on error messages

**User says**: "Can't connect to the database"

I will:
1. Verify DB container is running
2. Check connection string in .env
3. Test DB connectivity from app container
4. Review database logs for errors
5. Provide step-by-step resolution
